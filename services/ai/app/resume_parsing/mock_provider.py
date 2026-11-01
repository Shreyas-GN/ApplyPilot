"""Deterministic, no-external-calls fallback used whenever ANTHROPIC_API_KEY
isn't set — the local dev/test default (see docs/AI_AGENTS.md §2). It only
ever extracts what simple, auditable pattern-matching can find directly in
the text (an email, a phone number, a LinkedIn/GitHub/portfolio-looking
URL). It never guesses at employers, titles, dates, or skills — there is no
model here capable of inventing them, which is the whole point: a safe,
inspectable baseline rather than a worse LLM pretending to be one.
"""

import re

from .schemas import ResumeParsedData, ResumeParsedPersonal

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"(\+?\d[\d\-.\s()]{8,}\d)")
LINKEDIN_RE = re.compile(r"https?://(?:www\.)?linkedin\.com/\S+", re.IGNORECASE)
GITHUB_RE = re.compile(r"https?://(?:www\.)?github\.com/\S+", re.IGNORECASE)
URL_RE = re.compile(r"https?://\S+")

LOW_CONFIDENCE = 0.4


def parse_resume_mock(text: str) -> ResumeParsedData:
    email_match = EMAIL_RE.search(text)
    phone_match = PHONE_RE.search(text)
    linkedin_match = LINKEDIN_RE.search(text)
    github_match = GITHUB_RE.search(text)

    portfolio_url = None
    for url in URL_RE.findall(text):
        if "linkedin.com" not in url.lower() and "github.com" not in url.lower():
            portfolio_url = url.rstrip(".,)")
            break

    personal = ResumeParsedPersonal(
        email=email_match.group(0) if email_match else None,
        phone=phone_match.group(0).strip() if phone_match else None,
        linkedin_url=linkedin_match.group(0).rstrip(".,)") if linkedin_match else None,
        github_url=github_match.group(0).rstrip(".,)") if github_match else None,
        portfolio_url=portfolio_url,
    )

    return ResumeParsedData(
        personal=personal,
        experience=[],
        education=[],
        skills=[],
        projects=[],
        certifications=[],
        overall_confidence=LOW_CONFIDENCE if email_match or phone_match else 0.1,
    )
