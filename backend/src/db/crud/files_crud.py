from typing import List, Dict

from sqlalchemy.ext.asyncio import AsyncSession

from .documents_crud import (
    get_documents_by_user_id,
    get_documents_by_course_id,
    delete_documents_by_course,
    delete_documents_by_user,
    get_document_count_by_course,
    get_document_count_by_user
    )
from .images_crud import (
    get_images_by_user_id,
    get_images_by_course_id,
    get_image_count_by_course,
    get_image_count_by_user,
    delete_images_by_course,
    delete_images_by_user,
    )

 
async def get_all_files_by_course(db: AsyncSession, course_id: int) -> Dict[str, List]:
    """Get all documents and images for a course"""
    documents = await get_documents_by_course_id(db, course_id)
    images = await get_images_by_course_id(db, course_id)
    return {
        "documents": documents,
        "images": images
    }


async def get_all_files_by_user(db: AsyncSession, user_id: str) -> Dict[str, List]:
    """Get all documents and images for a user"""
    documents = await get_documents_by_user_id(db, user_id)
    images = await get_images_by_user_id(db, user_id)
    return {
        "documents": documents,
        "images": images
    }


async def delete_all_files_by_course(db: AsyncSession, course_id: int) -> Dict[str, int]:
    """Delete all documents and images for a course. Returns count of deleted files."""
    doc_count = await delete_documents_by_course(db, course_id)
    img_count = await delete_images_by_course(db, course_id)
    return {
        "documents_deleted": doc_count,
        "images_deleted": img_count
    }


async def delete_all_files_by_user(db: AsyncSession, user_id: str) -> Dict[str, int]:
    """Delete all documents and images for a user. Returns count of deleted files."""
    doc_count = await delete_documents_by_user(db, user_id)
    img_count = await delete_images_by_user(db, user_id)
    return {
        "documents_deleted": doc_count,
        "images_deleted": img_count
    }


async def get_file_counts_by_course(db: AsyncSession, course_id: int) -> Dict[str, int]:
    """Get count of documents and images for a course"""
    return {
        "document_count": await get_document_count_by_course(db, course_id),
        "image_count": await get_image_count_by_course(db, course_id)
    }


async def get_file_counts_by_user(db: AsyncSession, user_id: str) -> Dict[str, int]:
    """Get count of documents and images for a user"""
    return {
        "document_count": await get_document_count_by_user(db, user_id),
        "image_count": await get_image_count_by_user(db, user_id)
    }
