import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI


scheduler = AsyncIOScheduler()
logger = logging.getLogger(__name__)

for _logger_name in (
    "apscheduler.executors.default",
    "apscheduler.scheduler",
    "apscheduler.jobstores.default",
):
    logging.getLogger(_logger_name).setLevel(logging.WARNING)



@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Manage application lifecycle including startup and shutdown events."""
    logger.info("Starting application...")
    
    try:
        logger.info("Scheduler started.")   

        yield
    except Exception as e:  # noqa: BLE001
        logger.error("Error during startup: %s", e, exc_info=True)
        raise
    finally:
        logger.info("Shutting down application...")
        if scheduler.running:
            scheduler.shutdown()
            logger.info("Scheduler stopped.")
        logger.info("Application shutdown complete.")
