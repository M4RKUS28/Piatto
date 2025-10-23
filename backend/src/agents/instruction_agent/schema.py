"""
Schema for instruction agent
"""
from typing import Optional

from pydantic.v1 import Field, BaseModel


class InstructionStep(BaseModel):
    """Schema representing one instruction step."""
    text: str = (
        Field(description="The actual instructions in plain text"))
    timer: Optional[int] = (
        Field(description="If a timer is needed for this step, specify its duration in seconds."))
    animation: Optional[str] = (
        Field(description="If an animation is needed for this step, specify its name."))

class Instructions(BaseModel):
    """Schema representing a list of instruction steps."""
    steps: list[InstructionStep] = (
        Field(description="The instructions for cooking the recipe"))