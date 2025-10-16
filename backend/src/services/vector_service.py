"""
Vector service using ChromaDB
"""
import chromadb
import time
import logging

from google import genai
from typing import Dict, Optional
from ..config.settings import (
    CHROMA_HOST, CHROMA_PORT, CHROMA_SSL,
    EMBEDDING_MODEL
)

logger = logging.getLogger(__name__)


class VectorService:
    """Service for managing vector store operations"""
    def __init__(self, ):
        # Use HTTP client to connect to separate ChromaDB container
        #if CHROMA_CLIENT_TYPE == "http":

        logger.debug("Try connecting to ChromaDB at %s:%s", CHROMA_HOST, CHROMA_PORT)
        for i in range(5):
            try:
                self.client = chromadb.HttpClient(
                    host=CHROMA_HOST,
                    port=CHROMA_PORT,
                    ssl = CHROMA_SSL,
                )
                # Test connection
                self.client.list_collections()
                logger.info("Connected to ChromaDB at %s:%s", CHROMA_HOST, CHROMA_PORT)
                break
            except ConnectionError as e:
                logger.warning("Error connecting to ChromaDB at %s:%s: %s", CHROMA_HOST, CHROMA_PORT, e)
                if i == 4:
                    logger.error("Failed to connect to ChromaDB after 5 attempts, giving up.")
                    raise e
                time.sleep(2)
                
        #else:
        #    # Fallback for development
        #    #self.client = chromadb.PersistentClient(path="./chroma_db")
        #    raise ValueError("Unsupported CHROMA_CLIENT_TYPE")
            
        self.google_client = genai.Client()
        self.embedding_model = "gemini-embedding-001"

    def create_collection(self, collection_id: str):
        """Create a new collection in the vector store"""
        try:
            self.client.create_collection(name=collection_id)
        except Exception as e:
            logger.exception("Error creating collection %s: %s", collection_id, e)

    def create_collection_by_course_id(self, course_id: int):
        """Create a collection for a specific course"""
        collection_id = "course_" + str(course_id)
        self.create_collection(collection_id)
    
    def add_content_by_course_id(self, course_id: int, content_id: str, text: str, metadata: Dict):
        """Add content to vector store"""

        embedding = self.google_client.models.embed_content(
            model=self.embedding_model,
            contents=[text]).embeddings[0].values

        self.client.get_or_create_collection("course_" + str(course_id)).add(
            documents=[text],
            embeddings=embedding,
            metadatas=[metadata],
            ids=[content_id]
        )
    
    def search_by_course_id(self, course_id: int, query: str, n_results: int = 5, filter_metadata: Optional[Dict] = None):
        """Search for similar content"""
        embedding = self.google_client.models.embed_content(
            model=self.embedding_model,
            contents=[query]).embeddings[0].values

        results = self.client.get_or_create_collection("course_" + str(course_id)).query(
            query_embeddings=embedding,
            n_results=n_results,
            where=filter_metadata
        )
        return results

    
    def delete_content_by_course_id(self, course_id: int, content_id: str):
        """Delete content from vector store"""
        try:
            self.client.get_or_create_collection("course_" + str(course_id)).delete(ids=[content_id])
        except Exception as e:
            logger.exception("Error deleting content %s: %s", content_id, e)
    
    def update_content_by_course_id(self, course_id: int, content_id: str, text: str, metadata: Dict):
        """Update existing content"""
        self.delete_content_by_course_id(course_id, content_id)
        self.add_content_by_course_id(course_id, content_id, text, metadata)

    def get_collection_by_course_id(self, course_id: int):
        """Get collection by course ID"""
        return self.client.get_or_create_collection("course_" + str(course_id))
