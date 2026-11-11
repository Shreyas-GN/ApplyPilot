interface CandidateProfile {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
}

interface FieldMatch {
  key: string;
  label: string;
  value: string;
  selector: string;
}

function detectAts(): "greenhouse" | "lever" | "unknown" {
  const host = window.location.hostname;
  if (host.includes("greenhouse.io")) return "greenhouse";
  if (host.includes("lever.co")) return "lever";
  return "unknown";
}

function extractJobMetadata(ats: "greenhouse" | "lever" | "unknown") {
  const h1 = document.querySelector("h1")?.textContent?.trim() || document.title;
  let company = "";
  let location = "";

  if (ats === "greenhouse") {
    company =
      document.querySelector(".company-name")?.textContent?.replace(/^at\s+/i, "").trim() ||
      window.location.pathname.split("/").filter(Boolean)[0] ||
      "Company";
    location =
      document.querySelector(".location")?.textContent?.trim() || "";
  } else if (ats === "lever") {
    company =
      window.location.pathname.split("/").filter(Boolean)[0] || "Company";
    location =
      document.querySelector(".posting-categories .location")?.textContent?.trim() || "";
  }

  return {
    ats,
    company: company.charAt(0).toUpperCase() + company.slice(1),
    title: h1 || "Open Role",
    location: location || null,
    url: window.location.href,
  };
}

function findInput(selectors: string[]): { el: HTMLInputElement | HTMLTextAreaElement; selector: string } | null {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      return { el, selector };
    }
  }
  return null;
}

function computeFieldMatches(profile: CandidateProfile): FieldMatch[] {
  const fullName = profile.fullName?.trim() ?? "";
  const [firstName, ...rest] = fullName.split(/\s+/);
  const lastName = rest.join(" ");

  const candidates: Array<{ key: string; label: string; value: string | null | undefined; selectors: string[] }> = [
    {
      key: "firstName",
      label: "First name",
      value: firstName,
      selectors: ["#first_name", 'input[name="first_name"]', 'input[autocomplete="given-name"]'],
    },
    {
      key: "lastName",
      label: "Last name",
      value: lastName,
      selectors: ["#last_name", 'input[name="last_name"]', 'input[autocomplete="family-name"]'],
    },
    {
      key: "fullName",
      label: "Full name",
      value: fullName,
      selectors: ['input[name="name"]', 'input[autocomplete="name"]'],
    },
    {
      key: "email",
      label: "Email",
      value: profile.email,
      selectors: ["#email", 'input[name="email"]', 'input[type="email"]'],
    },
    {
      key: "phone",
      label: "Phone",
      value: profile.phone,
      selectors: ["#phone", 'input[name="phone"]', 'input[type="tel"]'],
    },
    {
      key: "location",
      label: "Location",
      value: profile.location,
      selectors: ['input[name="location"]', 'input[name*="location" i]', "#candidate-location"],
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      value: profile.linkedinUrl,
      selectors: ['input[name="urls[LinkedIn]"]', 'input[name*="linkedin" i]', 'input[id*="linkedin" i]'],
    },
    {
      key: "github",
      label: "GitHub",
      value: profile.githubUrl,
      selectors: ['input[name="urls[GitHub]"]', 'input[name*="github" i]', 'input[id*="github" i]'],
    },
    {
      key: "portfolio",
      label: "Portfolio / Website",
      value: profile.portfolioUrl,
      selectors: [
        'input[name="urls[Portfolio]"]',
        'input[name*="portfolio" i]',
        'input[name*="website" i]',
      ],
    },
  ];

  const matches: FieldMatch[] = [];
  for (const item of candidates) {
    if (!item.value || !item.value.trim()) continue;
    const found = findInput(item.selectors);
    if (found) {
      matches.push({
        key: item.key,
        label: item.label,
        value: item.value.trim(),
        selector: found.selector,
      });
    }
  }
  return matches;
}

function setNativeInputValue(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string
) {
  el.focus();
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "APPLYPILOT_INSPECT") {
    const ats = detectAts();
    const job = extractJobMetadata(ats);
    const previewFields = message.profile
      ? computeFieldMatches(message.profile as CandidateProfile)
      : [];
    sendResponse({ ok: true, job, previewFields });
    return false;
  }

  if (message?.type === "APPLYPILOT_APPLY_AUTOFILL") {
    const fields = (message.fields ?? []) as FieldMatch[];
    const filledLabels: string[] = [];
    for (const field of fields) {
      const el = document.querySelector(field.selector);
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        setNativeInputValue(el, field.value);
        filledLabels.push(field.label);
      }
    }
    sendResponse({ ok: true, filledLabels });
    return false;
  }

  return false;
});
