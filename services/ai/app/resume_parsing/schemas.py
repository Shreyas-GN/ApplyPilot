"""Pydantic models for resume-parsed data.

Field shape must stay byte-for-byte compatible with
packages/validators/src/resumeParsedData.ts — that Zod schema is the
authoritative, strictly-enforced contract; apps/workers re-validates
everything this service returns against it before persisting anything. This
module's job is just to make it hard for this service to accidentally emit
something that doesn't match.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


def to_camel(snake: str) -> str:
    first, *rest = snake.split("_")
    return first + "".join(word.capitalize() for word in rest)


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ResumeParsedPersonal(CamelModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None
    headline: str | None = None
    summary: str | None = None


class ResumeParsedExperience(CamelModel):
    company: str
    title: str
    location: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    is_current: bool = False
    description: str | None = None
    confidence: float
    source: str = "ai"


class ResumeParsedEducation(CamelModel):
    institution: str
    degree: str | None = None
    field_of_study: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    description: str | None = None
    confidence: float
    source: str = "ai"


class ResumeParsedSkill(CamelModel):
    name: str
    category: str | None = None
    confidence: float
    source: str = "ai"


class ResumeParsedProject(CamelModel):
    name: str
    description: str | None = None
    url: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    confidence: float
    source: str = "ai"


class ResumeParsedCertification(CamelModel):
    name: str
    issuer: str | None = None
    issue_date: str | None = None
    expiry_date: str | None = None
    credential_url: str | None = None
    confidence: float
    source: str = "ai"


class ResumeParsedData(CamelModel):
    personal: ResumeParsedPersonal = Field(default_factory=ResumeParsedPersonal)
    experience: list[ResumeParsedExperience] = Field(default_factory=list)
    education: list[ResumeParsedEducation] = Field(default_factory=list)
    skills: list[ResumeParsedSkill] = Field(default_factory=list)
    projects: list[ResumeParsedProject] = Field(default_factory=list)
    certifications: list[ResumeParsedCertification] = Field(default_factory=list)
    overall_confidence: float | None = None


class ParseResumeRequest(BaseModel):
    text: str
