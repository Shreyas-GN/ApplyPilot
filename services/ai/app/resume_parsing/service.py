from app.config import Settings

from .anthropic_provider import parse_resume_with_claude
from .mock_provider import parse_resume_mock
from .schemas import ResumeParsedData


def parse_resume(text: str, settings: Settings) -> ResumeParsedData:
    # Deliberately no silent fallback to the mock provider on a Claude
    # failure: that would show the user a mostly-empty, oddly-low-confidence
    # review screen with no indication anything went wrong. If Claude is
    # configured, a failure should surface as a failure (the caller marks
    # the resume's processing status accordingly) so the user can retry,
    # not be quietly swapped for a worse result.
    if settings.anthropic_api_key:
        return parse_resume_with_claude(text, settings.anthropic_api_key, settings.anthropic_model)
    return parse_resume_mock(text)
