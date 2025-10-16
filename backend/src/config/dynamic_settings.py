import json
from dataclasses import dataclass
from typing import Any, Dict

__all__ = [
    "DynamicSettingDefinition",
    "DYNAMIC_SETTINGS_REGISTRY",
    "register_dynamic_setting",
]


@dataclass(frozen=True)
class DynamicSettingDefinition:
    """Metadata and default values for dynamic, database-backed settings."""

    key: str
    default: Any
    value_type: str = "json"
    description: str | None = None
    category: str = "general"

    def serialize(self, value: Any) -> str:
        """Serialize a Python value into a string for persistence."""

        try:
            return json.dumps(value)
        except TypeError as exc:  # pragma: no cover - guard for unexpected types
            raise ValueError(f"Unsupported value for setting '{self.key}': {value!r}") from exc

    def deserialize(self, raw_value: str) -> Any:
        """Deserialize a stored string value back into a Python object."""

        try:
            return json.loads(raw_value)
        except json.JSONDecodeError:
            return raw_value


DYNAMIC_SETTINGS_REGISTRY: Dict[str, DynamicSettingDefinition] = {}


def register_dynamic_setting(
    key: str,
    default: Any,
    *,
    value_type: str = "json",
    description: str | None = None,
    category: str = "general",
) -> DynamicSettingDefinition:
    """Register a dynamic setting and expose its default as module-level constant."""

    if key in DYNAMIC_SETTINGS_REGISTRY:
        raise ValueError(f"Dynamic setting '{key}' is already registered")

    definition = DynamicSettingDefinition(
        key=key,
        default=default,
        value_type=value_type,
        description=description,
        category=category,
    )
    DYNAMIC_SETTINGS_REGISTRY[key] = definition
    globals()[key] = default
    if key not in __all__:
        __all__.append(key)
    return definition


# Password policy
register_dynamic_setting(
    "MIN_PASSWORD_LENGTH",
    3,
    value_type="int",
    description="Minimum password length required for user credentials.",
    category="password_policy",
)
register_dynamic_setting(
    "PASSWORD_REQUIRE_UPPERCASE",
    False,
    value_type="bool",
    description="If true, passwords must include at least one uppercase character.",
    category="password_policy",
)
register_dynamic_setting(
    "PASSWORD_REQUIRE_LOWERCASE",
    False,
    value_type="bool",
    description="If true, passwords must include at least one lowercase character.",
    category="password_policy",
)
register_dynamic_setting(
    "PASSWORD_REQUIRE_DIGIT",
    False,
    value_type="bool",
    description="If true, passwords must include at least one numeric character.",
    category="password_policy",
)
register_dynamic_setting(
    "PASSWORD_REQUIRE_SPECIAL_CHAR",
    False,
    value_type="bool",
    description="If true, passwords must include at least one special character.",
    category="password_policy",
)
register_dynamic_setting(
    "PASSWORD_SPECIAL_CHARACTERS_REGEX_PATTERN",
    r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?~`]",
    value_type="str",
    description="Regex pattern defining allowed special characters for passwords.",
    category="password_policy",
)

# Registration toggle
register_dynamic_setting(
    "DISABLE_REGISTRATION",
    False,
    value_type="bool",
    description="If true, prevents new users from registering via the public API.",
    category="access_control",
)



# Usage quotas / role-based limits
register_dynamic_setting(
    "ROLE_BASED_COURSE_CREATION_LIMITS",
    {
        "user": 5,
        "plus_user": 15,
        "pro_user": 50,
        "admin": -1  # -1 means unlimited
    },
    value_type="json",
    description="Maximum number of courses each user role may create. -1 means unlimited.",
    category="usage_limits",
)
register_dynamic_setting(
    "ROLE_BASED_PRESENT_COURSES_LIMITS",
    {
        "user": 3,
        "plus_user": 10,
        "pro_user": 25,
        "admin": -1  # -1 means unlimited
    },
    value_type="json",
    description="Maximum number of concurrently active courses per user role. -1 means unlimited.",
    category="usage_limits",
)
register_dynamic_setting(
    "ROLE_BASED_CHAT_USAGE_LIMITS",
    {
        "user": 50,
        "plus_user": 200,
        "pro_user": 1000,
        "admin": -1  # -1 means unlimited
    },
    value_type="json",
    description="Maximum chat interactions allowed per user role. -1 means unlimited.",
    category="usage_limits",
)


# Agent configuration
register_dynamic_setting(
    "EXPLAINER_AGENT_MODEL",
    "gemini-2.5-pro",
    value_type="str",
    description="Default model used by the explainer agent when generating content.",
    category="agents",
)
register_dynamic_setting(
    "EXPLAINER_AGENT_ITERATIONS",
    3,
    value_type="int",
    description="Number of attempts the explainer agent makes before returning an error.",
    category="agents",
)
register_dynamic_setting(
    "STANDARD_AGENT_MODEL",
    "gemini-2.5-flash",
    value_type="str",
    description="Default model assigned in the base standard agent implementation.",
    category="agents",
)
register_dynamic_setting(
    "STRUCTURED_AGENT_MODEL",
    "gemini-2.5-flash",
    value_type="str",
    description="Default model assigned in the base structured agent implementation.",
    category="agents",
)
register_dynamic_setting(
    "CHAT_AGENT_MODEL",
    "gemini-2.5-flash",
    value_type="str",
    description="Model used by the chat agent when responding to user prompts.",
    category="agents",
)
register_dynamic_setting(
    "PLANNER_AGENT_MODEL",
    "gemini-2.5-flash-lite",
    value_type="str",
    description="Model used by the planner agent to generate course outlines.",
    category="agents",
)
register_dynamic_setting(
    "TESTER_INITIAL_AGENT_MODEL",
    "gemini-2.5-flash",
    value_type="str",
    description="Model used by the initial tester agent for question generation.",
    category="agents",
)
register_dynamic_setting(
    "TESTER_CODE_REVIEW_AGENT_MODEL",
    "gemini-2.5-flash",
    value_type="str",
    description="Model used by the tester code review agent for validating JSX output.",
    category="agents",
)
register_dynamic_setting(
    "IMAGE_AGENT_MODEL",
    "gemini-2.5-flash-lite",
    value_type="str",
    description="Model used by the image agent when orchestrating MCP image lookups.",
    category="agents",
)
register_dynamic_setting(
    "INFO_AGENT_MODEL",
    "gemini-2.5-flash-lite",
    value_type="str",
    description="Model used by the info agent for generating course summaries.",
    category="agents",
)
register_dynamic_setting(
    "GRADER_AGENT_MODEL",
    "gemini-2.0-flash",
    value_type="str",
    description="Model used by the grader agent for assessing learner submissions.",
    category="agents",
)
register_dynamic_setting(
    "LEARNING_FLASHCARD_AGENT_MODEL",
    "gemini-2.5-pro",
    value_type="str",
    description="Model used by the learning flashcard agent to generate study cards.",
    category="agents",
)
register_dynamic_setting(
    "TESTING_FLASHCARD_AGENT_MODEL",
    "gemini-2.5-pro",
    value_type="str",
    description="Model used by the testing flashcard agent to create multiple choice questions.",
    category="agents",
)
