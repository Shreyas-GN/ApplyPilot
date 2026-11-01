"""Claude-backed resume parsing. Only used when ANTHROPIC_API_KEY is set —
otherwise mock_provider.py is used instead (see app/resume_parsing/service.py).
"""

import json
import logging
import re

from anthropic import Anthropic

from .schemas import ResumeParsedData

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You extract structured information from resume text for a job-search \
product. You must follow these rules exactly:

1. Only output information that is explicitly present in the resume text. Never invent, \
infer, or guess an employer, job title, date, school, certification, or skill that is not \
written in the text.
2. If a date is ambiguous or missing, leave it empty rather than guessing.
3. For every entry you output, include a "confidence" number from 0 to 1 reflecting how \
certain you are the entry is both present and correctly transcribed from the text.
4. Set "source" to "ai" on every entry you output.
5. Output ONLY a single JSON object matching this exact shape, with no commentary, no \
markdown code fences, and no extra top-level keys:

{
  "personal": {"fullName": "", "email": "", "phone": "", "location": "", "linkedinUrl": "", \
"githubUrl": "", "portfolioUrl": "", "headline": "", "summary": ""},
  "experience": [{"company": "", "title": "", "location": "", "startDate": "", "endDate": "", \
"isCurrent": false, "description": "", "confidence": 0.0, "source": "ai"}],
  "education": [{"institution": "", "degree": "", "fieldOfStudy": "", "startDate": "", \
"endDate": "", "description": "", "confidence": 0.0, "source": "ai"}],
  "skills": [{"name": "", "category": "", "confidence": 0.0, "source": "ai"}],
  "projects": [{"name": "", "description": "", "url": "", "startDate": "", "endDate": "", \
"confidence": 0.0, "source": "ai"}],
  "certifications": [{"name": "", "issuer": "", "issueDate": "", "expiryDate": "", \
"credentialUrl": "", "confidence": 0.0, "source": "ai"}],
  "overallConfidence": 0.0
}

Omit any personal field you cannot find rather than leaving it as an empty string. Omit \
entire sections (as empty arrays) you find no evidence for."""


def _extract_json(raw: str) -> str:
    stripped = raw.strip()
    fence_match = re.match(r"^```(?:json)?\s*(.*?)\s*```$", stripped, re.DOTALL)
    return fence_match.group(1) if fence_match else stripped


def parse_resume_with_claude(text: str, api_key: str, model: str) -> ResumeParsedData:
    client = Anthropic(api_key=api_key)
    response = client.messages.create(
        model=model,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Resume text:\n\n{text}"}],
    )
    raw_text = "".join(block.text for block in response.content if block.type == "text")

    try:
        payload = json.loads(_extract_json(raw_text))
    except json.JSONDecodeError as exc:
        logger.error("Claude did not return valid JSON for resume parsing: %s", raw_text[:500])
        raise ValueError("AI provider returned a non-JSON response") from exc

    return ResumeParsedData.model_validate(payload)
