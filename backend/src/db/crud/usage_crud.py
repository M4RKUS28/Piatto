import datetime
from collections import defaultdict
from typing import Dict, List, Optional

from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import and_, func as sa_func
from sqlalchemy.orm import Session

from ...api.schemas.statistics import UsagePost
from ..models.db_course import Course
from ..models.db_usage import Usage


DEFAULT_TIMEZONE_NAME = "UTC"


def _resolve_timezone(timezone_name: Optional[str]) -> ZoneInfo:
    """Convert an optional timezone string into a ZoneInfo instance, defaulting to UTC."""

    if timezone_name:
        try:
            return ZoneInfo(timezone_name)
        except ZoneInfoNotFoundError:
            pass
    return ZoneInfo(DEFAULT_TIMEZONE_NAME)


def _get_timezone_identifier(zone: ZoneInfo, fallback: Optional[str] = None) -> str:
    """Return a timezone identifier suitable for SQL functions like CONVERT_TZ."""

    key = getattr(zone, "key", None)
    if key:
        return key
    if fallback:
        return fallback
    return DEFAULT_TIMEZONE_NAME


def _compute_utc_bounds(
    start_date: datetime.date,
    end_date: datetime.date,
    zone: ZoneInfo,
) -> tuple[datetime.datetime, datetime.datetime]:
    """Convert local date boundaries to naive UTC datetimes for database filtering."""

    start_local = datetime.datetime.combine(start_date, datetime.time.min, tzinfo=zone)
    end_local = datetime.datetime.combine(end_date, datetime.time.min, tzinfo=zone)
    start_utc = start_local.astimezone(datetime.timezone.utc).replace(tzinfo=None)
    end_utc = end_local.astimezone(datetime.timezone.utc).replace(tzinfo=None)
    return start_utc, end_utc


def _localize_timestamp_for_query(
    db: Session,
    timestamp_column,
    timezone_identifier: str,
):
    """Return a SQL expression that converts the timestamp column into the user's timezone."""

    dialect = (db.bind.dialect.name if db.bind and db.bind.dialect else "").lower()
    if "mysql" in dialect:
        return sa_func.convert_tz(timestamp_column, DEFAULT_TIMEZONE_NAME, timezone_identifier)
    if dialect in {"postgresql", "postgres"}:
        return sa_func.timezone(timezone_identifier, timestamp_column)
    return timestamp_column

from ..models.db_user import User


def log_usage(db: Session, user_id: str, action: str, course_id: Optional[int] = None, chapter_id: Optional[int] = None, details: Optional[str] = None) -> Usage:
    """
    Log a user action in the database.
    
    :param db: Database session
    :param user_id: ID of the user performing the action
    :param action: Action performed by the user (e.g., "view", "complete", "start", "create", "delete")
    :param course_id: Optional course ID if the action is related to a specific course
    :param chapter_id: Optional chapter ID if the action is related to a specific chapter
    :param details: Additional details about the action
    :return: The created Usage object
    """
    usage = Usage(
        user_id=user_id,
        action=action,
        course_id=course_id,
        chapter_id=chapter_id,
        details=details
    )

    db.add(usage)
    db.commit()
    db.refresh(usage)

    return usage


def get_user_usages(db: Session, user_id: str) -> List[Usage]:
    """
    Get all usage records for a specific user.
    
    :param db: Database session
    :param user_id: ID of the user
    :return: List of Usage objects for the user
    """
    return db.query(Usage).filter(Usage.user_id == user_id).all()


def get_usage_by_action(db: Session, user_id: str, action: str) -> List[Usage]:
    """
    Get all usage records for a specific user filtered by action.
    
    :param db: Database session
    :param user_id: ID of the user
    :param action: Action to filter by (e.g., "view", "complete", "start", "create", "delete")
    :return: List of Usage objects for the user with the specified action
    """
    return db.query(Usage).filter(Usage.user_id == user_id, Usage.action == action).all()


def log_chat_usage(db: Session, user_id: str, course_id: int, chapter_id: int, message: str) -> Usage:
    """
    Log a chat message sent by a user.
    
    :param db: Database session
    :param user_id: ID of the user sending the message
    :param message: The chat message content
    :return: The created Usage object
    """
    return log_usage(db, user_id, action="chat", course_id=course_id, chapter_id=chapter_id, details=message)


def get_total_chat_usages(db: Session, user_id: str) -> int:
    """
    Get the total number of chat messages sent by a user.
    
    :param db: Database session
    :param user_id: ID of the user
    :return: Total number of chat messages
    """
    return db.query(Usage).filter(Usage.user_id == user_id, Usage.action == "chat").count()


def get_total_quizz_usages(db: Session, user_id: str) -> int:
    """
    Get the total number of quizz attempts sent by a user.
    
    :param db: Database session
    :param user_id: ID of the user
    :return: Total number of quizz attempts
    """
    return db.query(Usage).filter(Usage.user_id == user_id, Usage.action == "grade_question").count()


def get_total_created_courses(db: Session, user_id: str) -> int:
    """
    Get the total number of courses created by a user.
    
    :param db: Database session
    :param user_id: ID of the user
    :return: Total number of courses created
    """
    return db.query(Usage).filter(Usage.user_id == user_id, Usage.action == "create_course").count()


def log_course_creation(db: Session, user_id: str, course_id: int, detail: str) -> Usage:
    """
    Log the creation of a course by a user.
    
    :param db: Database session
    :param user_id: ID of the user creating the course
    :param course_id: ID of the created course
    :return: The created Usage object
    """
    return log_usage(db, user_id, action="create_course", course_id=course_id, details=detail)


def log_chapter_completion(db: Session, user_id: str, course_id: int, chapter_id: int) -> Usage:
    """
    Log the completion of a chapter by a user.
    
    :param db: Database session
    :param user_id: ID of the user completing the chapter
    :param course_id: ID of the course containing the chapter
    :param chapter_id: ID of the completed chapter
    :return: The created Usage object
    """
    return log_usage(db, user_id, action="complete_chapter", course_id=course_id, chapter_id=chapter_id)


def get_total_time_spent_on_chapters(db: Session, user_id: str) -> int:
    """
    Get the total time spent by a user on chapters: Calculate total time: every open followed by a close time differences summed up.
    Handles edge cases: skips unmatched opens, ignores unmatched closes, and processes in timestamp order.
    :param db: Database session
    :param user_id: ID of the user
    :return: Total time spent on chapters in minutes
    """
    usages = (
        db.query(Usage)
        .filter(Usage.user_id == user_id, Usage.action == "site_visible", Usage.course_id != None, Usage.chapter_id != None)
        .count()
    )

    return usages * 10


def get_user_with_total_usage_time(db: Session, offset: int = 0, limit: int = 200):
    """
    Get users with their total usage time in minutes.
    
    :param db: Database session
    :param offset: Number of records to skip (for pagination)
    :param limit: Maximum number of records to return (for pagination)
    :return: List of users with their total usage time in minutes
    """
    

    # Subquery to count site_visible actions per user
    usage_counts = (
        db.query(
            Usage.user_id,
            sa_func.count(Usage.id).label('usage_count')
        )
        .filter(
            Usage.action == "site_visible",
            Usage.course_id != None,
            Usage.chapter_id != None
        )
        .group_by(Usage.user_id)
        .subquery()
    )
    
    # Main query to join with users and calculate total time
    user_usages = (
        db.query(
            User,
            (sa_func.coalesce(usage_counts.c.usage_count, 0) * 10).label('total_usage_time')
        )
        .outerjoin(
            usage_counts,
            User.id == usage_counts.c.user_id
        )
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    # Format the result to include user object and total_usage_time
    return [
        {
            'user': user,
            'total_usage_time': total_usage_time
        }
        for user, total_usage_time in user_usages
    ]


def log_site_usage(db: Session, usage: UsagePost ) -> Usage:
    """
    Log a user action on the site.
    
    :param db: Database session
    :param usage: UsagePost object containing user_id, course_id, chapter_id, and url
    :return: The created Usage object
    """
    return log_usage(db,
        user_id=usage.user_id,
        action="site" + ("_visible" if usage.visible else "_hidden"),
        course_id=usage.course_id,
        chapter_id=usage.chapter_id,
        details=usage.url)


def log_login(db: Session, user_id: str) -> Usage:
    """
    Log a user login action.
    
    :param db: Database session
    :param user_id: ID of the user logging in
    :return: The created Usage object
    """
    return log_usage(db, user_id, action="login")


def log_admin_login_as(db: Session, user_who: str, user_as: str) -> Usage:
    """
    Log an admin login-as action.
    
    :param db: Database session
    :param user_who: ID of the admin logging in as
    :param user_as: ID of the user being logged in as
    :return: The created Usage object
    """
    return log_usage(db, user_who, action="admin_login_as", details="Admin logged in as user: " + user_as)


def log_refresh(db: Session, user_id: str) -> Usage:
    """
    Log a user refresh action.
    
    :param db: Database session
    :param user_id: ID of the user refreshing their session
    :return: The created Usage object
    """
    return log_usage(db, user_id, action="refresh")


def log_logout(db: Session, user_id: str) -> Usage:
    """
    Log a user logout action.
    
    :param db: Database session
    :param user_id: ID of the user logging out
    :return: The created Usage object
    """
    return log_usage(db, user_id, action="logout")


def get_login_count(db: Session, user_id: str) -> int:
    """
    Get the total number of login actions for a user.
    
    :param db: Database session
    :param user_id: ID of the user
    :return: Total number of login actions
    """
    return db.query(Usage).filter(Usage.user_id == user_id, Usage.action == "login").count()


def log_promote_to_admin(db: Session, user_id: str, which_user: str) -> Usage:
    """
    Log a user promotion to admin action.
    
    :param db: Database session
    :param user_id: ID of the user promoting
    :param which_user: ID of the user being promoted
    :return: The created Usage object
    """
    return log_usage(db, user_id, action="promote_to_admin", details="Promoted user: " + which_user)


def log_demote_from_admin(db: Session, user_id: str, which_user: str) -> Usage:
    """
    Log a user demotion from admin action.
    
    :param db: Database session
    :param user_id: ID of the user demoting
    :param which_user: ID of the user being demoted
    :return: The created Usage object
    """
    return log_usage(db, user_id, action="demote_from_admin", details="Demoted user: " + which_user)


def log_search(db: Session, user_id: str, query: str) -> Usage:
    """
    Log a search action performed by a user.
    
    :param db: Database session
    :param user_id: ID of the user performing the search
    :param query: The search query string
    :return: The created Usage object
    """
    return log_usage(db, user_id, action="search", details=query)


def get_usage_stats_from_until(db: Session, user_id: str, from_date: datetime.date, to_date: datetime.date):
    """
    Get usage statistics for a user between two dates.
    
    :param db: Database session
    :param user_id: ID of the user
    :param from_date: Start date (inclusive)
    :param to_date: End date (exclusive)

    :return: List of Usage objects + Course objects within the specified date range
    """

    return db.query(Usage, Course).filter(
        and_(
            Usage.user_id == user_id,
            Usage.timestamp >= from_date,
            Usage.timestamp < to_date
        )
    ).join(Course, Usage.course_id == Course.id).order_by(Usage.timestamp).all()


def get_usage_stats_by_course_generic(
    db: Session,
    user_id: str,
    start_date: datetime.date,
    end_date: datetime.date,
    time_unit: str,
    timezone: Optional[str] = None,
) -> Dict[str, Dict[str, int]]:
    """
    Generic function to get usage statistics for a user within a date range, grouped by course and time unit.
    
    :param db: Database session
    :param user_id: ID of the user
    :param start_date: Start date (inclusive)
    :param end_date: End date (exclusive)
    :param time_unit: Time unit for grouping ('hour', 'day', 'dow', 'month', 'year')
    :return: Dictionary with course name as key and time unit dictionary as value
    """
    zone = _resolve_timezone(timezone)
    timezone_identifier = _get_timezone_identifier(zone, timezone)
    start_utc, end_utc = _compute_utc_bounds(start_date, end_date, zone)

    import logging
    logger = logging.getLogger(__name__)
    logger.debug(
        "Computing usage stats for user=%s from=%s to=%s timezone=%s",
        user_id,
        start_date,
        end_date,
        timezone_identifier,
    )
    logger.debug("UTC bounds: %s to %s", start_utc, end_utc)

    localized_timestamp = _localize_timestamp_for_query(db, Usage.timestamp, timezone_identifier)
    # mysql_tzinfo_to_sql /usr/share/zoneinfo | sudo mysql -u root --password="" mysql ### RUN THIS ON MYSQL SERVER TO LOAD TIMEZONE INFO
    time_unit_expr = sa_func.extract(time_unit, localized_timestamp).label("time_unit")
    count_x10_expr = (sa_func.count(Usage.id) * 10).label("count_x10")

    result = (
        db.query(
            Course.id,
            Course.title,
            time_unit_expr,
            count_x10_expr,
        )
        .join(Course, Usage.course_id == Course.id)  # add this to remove public courses from statistics: and Course.user_id == user_id
        .filter(
            and_(
                Usage.user_id == user_id,
                Usage.timestamp >= start_utc,
                Usage.timestamp < end_utc,
                Usage.action == "site_visible",
            )
        )
        .group_by(Course.id, Course.title, time_unit_expr)
        .having(count_x10_expr > 50)
        .order_by(Course.id, time_unit_expr)
        .all()
    )

    logger.debug("Usage stats by course: %s", result)

    stats_by_course: Dict[str, Dict[str, int]] = {}

    for _, course_name, time_val, count_x10 in result:
        if time_val is None or count_x10 is None:
            break
        stats_by_course.setdefault(course_name, {})[str(int(time_val))] = int(count_x10)

    return stats_by_course


def get_usage_today_by_hour_by_course(
    db: Session,
    user_id: str,
    timezone: Optional[str] = None,
) -> Dict[str, Dict[str, int]]:
    """
    Get usage statistics for today, grouped by course and hour.
    
    :param db: Database session
    :param user_id: ID of the user
    :return: Dictionary with course name as key and hour dictionary as value
    """
    zone = _resolve_timezone(timezone)
    timezone_identifier = _get_timezone_identifier(zone, timezone)
    today = datetime.datetime.now(zone).date()
    tomorrow = today + datetime.timedelta(days=1)
    return get_usage_stats_by_course_generic(db, user_id, today, tomorrow, "hour", timezone=timezone_identifier)


def get_usage_this_week_by_day_by_course(
    db: Session,
    user_id: str,
    timezone: Optional[str] = None,
) -> Dict[str, Dict[str, int]]:
    """
    Get usage statistics for this week, grouped by course and day of week.
    
    :param db: Database session
    :param user_id: ID of the user
    :return: Dictionary with course name as key and day of week dictionary as value (1-7, Monday=1)
    """
    zone = _resolve_timezone(timezone)
    timezone_identifier = _get_timezone_identifier(zone, timezone)
    today = datetime.datetime.now(zone).date()
    monday = today - datetime.timedelta(days=today.weekday())
    next_monday = monday + datetime.timedelta(days=7)
    return get_usage_stats_by_course_generic(db, user_id, monday, next_monday, "day", timezone=timezone_identifier)


def get_usage_this_month_by_day_by_course(
    db: Session,
    user_id: str,
    timezone: Optional[str] = None,
) -> Dict[str, Dict[str, int]]:
    """
    Get usage statistics for this month, grouped by course and day of month.
    
    :param db: Database session
    :param user_id: ID of the user
    :return: Dictionary with course name as key and day of month dictionary as value (1-31)
    """
    zone = _resolve_timezone(timezone)
    timezone_identifier = _get_timezone_identifier(zone, timezone)
    today = datetime.datetime.now(zone).date()
    first_day = today.replace(day=1)
    if today.month == 12:
        next_month = first_day.replace(year=today.year + 1, month=1)
    else:
        next_month = first_day.replace(month=today.month + 1)
    return get_usage_stats_by_course_generic(db, user_id, first_day, next_month, "day", timezone=timezone_identifier)


def get_usage_this_year_by_month_by_course(
    db: Session,
    user_id: str,
    timezone: Optional[str] = None,
) -> Dict[str, Dict[str, int]]:
    """
    Get usage statistics for this year, grouped by course and month.
    
    :param db: Database session
    :param user_id: ID of the user
    :return: Dictionary with course name as key and month dictionary as value (1-12)
    """
    zone = _resolve_timezone(timezone)
    timezone_identifier = _get_timezone_identifier(zone, timezone)
    today = datetime.datetime.now(zone).date()
    first_day = today.replace(month=1, day=1)
    next_year = first_day.replace(year=today.year + 1)
    return get_usage_stats_by_course_generic(db, user_id, first_day, next_year, "month", timezone=timezone_identifier)
