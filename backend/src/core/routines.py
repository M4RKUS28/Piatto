"""
Core routines
"""
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from ..db.database import get_db
from ..db.models.db_course import Course, CourseStatus  # Your SQLAlchemy model
from ..services.settings_service import refresh_dynamic_settings_cache


def update_stuck_courses():
    """
    Check for courses that are stuck in 'creating' status for more than 2 hours
    and mark them as 'error'.
    """
    db_gen = get_db()
    db: Session = next(db_gen)

    try:
        threshold = datetime.now(timezone.utc) - timedelta(hours=2) # 2 hours threshold

        stuck_courses = db.query(Course).filter(
            Course.status == "creating",
            Course.created_at < threshold
        ).all()

        if stuck_courses:
            for course in stuck_courses:
                logging.info("Marking course %s as error due to timeout.", course.id)

                course.status = CourseStatus.FAILED  # type: ignore[assignment]
                course.error_msg = "Course creation timed out."  # type: ignore[assignment]
            db.commit()
            logging.info("Marked %s stuck courses as error.", len(stuck_courses))
        else:
            db.commit()

    except SQLAlchemyError as e:
        logging.error("Scheduler error: %s", e)
    finally:
        next(db_gen, None)


def refresh_dynamic_settings_cache_routine() -> None:
    """Refresh the dynamic settings cache from the database."""

    #logging.debug("Refreshing dynamic settings cache from database...")
    try:
        refresh_dynamic_settings_cache(force=True)
    except Exception as exc:  # pragma: no cover - defensive logging in scheduler  # noqa: BLE001
        logging.error("Failed to refresh dynamic settings cache: %s", exc, exc_info=True)

