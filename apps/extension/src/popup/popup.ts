interface JobMeta {
  ats: string;
  company: string;
  title: string;
  location: string | null;
  url: string;
}

interface FieldMatch {
  key: string;
  label: string;
  value: string;
  selector: string;
}

interface ProfilePayload {
  profile: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    portfolioUrl: string | null;
  };
}

const pairView = document.getElementById("pair-view")!;
const copilotView = document.getElementById("copilot-view")!;
const actionsCard = document.getElementById("actions-card")!;
const previewCard = document.getElementById("preview-card")!;
const fieldList = document.getElementById("field-list")!;
const statusEl = document.getElementById("status")!;
const subtitleEl = document.getElementById("subtitle")!;
const candidateNameEl = document.getElementById("candidate-name")!;
const atsBadgeEl = document.getElementById("ats-badge")!;
const jobSummaryEl = document.getElementById("job-summary")!;
const apiUrlInput = document.getElementById("api-url") as HTMLInputElement;
const tokenInput = document.getElementById("token-input") as HTMLInputElement;

let activeProfile: ProfilePayload | null = null;
let currentTabId: number | null = null;
let detectedJob: JobMeta | null = null;
let previewFields: FieldMatch[] = [];

function setStatus(message: string, tone: "ok" | "error" | "" = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${tone}`.trim();
}

async function inspectActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) {
    atsBadgeEl.textContent = "No active tab";
    return;
  }
  currentTabId = tab.id;

  const isSupportedAts =
    tab.url.includes("greenhouse.io") || tab.url.includes("lever.co");
  if (!isSupportedAts) {
    atsBadgeEl.textContent = "Unsupported site";
    actionsCard.classList.add("hidden");
    return;
  }

  chrome.tabs.sendMessage(
    tab.id,
    { type: "APPLYPILOT_INSPECT", profile: activeProfile?.profile ?? null },
    (response) => {
      if (chrome.runtime.lastError || !response?.ok) {
        atsBadgeEl.textContent = "Reload tab";
        jobSummaryEl.textContent = "Refresh this ATS page to activate ApplyPilot Co-pilot.";
        return;
      }
      detectedJob = response.job as JobMeta;
      previewFields = (response.previewFields ?? []) as FieldMatch[];
      atsBadgeEl.textContent = detectedJob.ats.toUpperCase();
      jobSummaryEl.textContent = `${detectedJob.title} at ${detectedJob.company}`;
      actionsCard.classList.remove("hidden");
    }
  );
}

async function init() {
  const stored = await chrome.storage.local.get(["apiBaseUrl", "token"]);
  if (typeof stored.apiBaseUrl === "string" && stored.apiBaseUrl) {
    apiUrlInput.value = stored.apiBaseUrl;
  }

  if (typeof stored.token !== "string" || !stored.token) {
    pairView.classList.remove("hidden");
    copilotView.classList.add("hidden");
    return;
  }

  chrome.runtime.sendMessage({ type: "APPLYPILOT_FETCH_PROFILE" }, (res) => {
    if (!res?.ok) {
      pairView.classList.remove("hidden");
      copilotView.classList.add("hidden");
      setStatus(res?.error || "Session expired — reconnect in Settings.", "error");
      return;
    }

    activeProfile = res.data as ProfilePayload;
    candidateNameEl.textContent =
      activeProfile.profile.fullName ||
      activeProfile.profile.email ||
      "Connected";
    subtitleEl.textContent = "Human-in-the-loop Co-pilot ready.";
    pairView.classList.add("hidden");
    copilotView.classList.remove("hidden");
    void inspectActiveTab();
  });
}

document.getElementById("connect-btn")?.addEventListener("click", () => {
  const apiBaseUrl = apiUrlInput.value.trim().replace(/\/+$/, "");
  const token = tokenInput.value.trim();
  if (!apiBaseUrl || !token) {
    setStatus("Enter both your ApplyPilot URL and pairing token.", "error");
    return;
  }
  setStatus("Verifying token…");
  chrome.runtime.sendMessage(
    { type: "APPLYPILOT_FETCH_PROFILE", apiBaseUrl, token },
    async (res) => {
      if (!res?.ok) {
        setStatus(res?.error || "Failed to verify token.", "error");
        return;
      }
      await chrome.storage.local.set({ apiBaseUrl, token });
      setStatus("Connected!", "ok");
      void init();
    }
  );
});

document.getElementById("save-job-btn")?.addEventListener("click", () => {
  if (!detectedJob) return;
  setStatus("Saving job…");
  chrome.runtime.sendMessage(
    {
      type: "APPLYPILOT_CAPTURE_APP",
      payload: { ...detectedJob, status: "saved" },
    },
    (res) => {
      setStatus(
        res?.ok ? "Saved to ApplyPilot tracker." : res?.error || "Save failed.",
        res?.ok ? "ok" : "error"
      );
    }
  );
});

document.getElementById("mark-applied-btn")?.addEventListener("click", () => {
  if (!detectedJob) return;
  setStatus("Updating tracker…");
  chrome.runtime.sendMessage(
    {
      type: "APPLYPILOT_CAPTURE_APP",
      payload: { ...detectedJob, status: "applied" },
    },
    (res) => {
      setStatus(
        res?.ok ? "Marked as applied in tracker." : res?.error || "Update failed.",
        res?.ok ? "ok" : "error"
      );
    }
  );
});

document.getElementById("preview-fill-btn")?.addEventListener("click", () => {
  fieldList.innerHTML = "";
  if (previewFields.length === 0) {
    setStatus("No matching empty form fields detected on this page.", "error");
    previewCard.classList.add("hidden");
    return;
  }
  for (const field of previewFields) {
    const li = document.createElement("li");
    li.textContent = `${field.label}: ${field.value}`;
    fieldList.appendChild(li);
  }
  previewCard.classList.remove("hidden");
  setStatus("Review mapped values above before filling.", "");
});

document.getElementById("confirm-fill-btn")?.addEventListener("click", () => {
  if (!currentTabId || !detectedJob || previewFields.length === 0) return;
  chrome.tabs.sendMessage(
    currentTabId,
    { type: "APPLYPILOT_APPLY_AUTOFILL", fields: previewFields },
    (res) => {
      if (!res?.ok) {
        setStatus("Could not fill fields on this page.", "error");
        return;
      }
      const filledFields = (res.filledLabels ?? []) as string[];
      chrome.runtime.sendMessage(
        {
          type: "APPLYPILOT_CAPTURE_APP",
          payload: { ...detectedJob, status: "saved", filledFields },
        },
        () => {
          setStatus(
            `Filled ${filledFields.length} fields (never auto-submits). Review form and submit yourself.`,
            "ok"
          );
          previewCard.classList.add("hidden");
        }
      );
    }
  );
});

document.getElementById("disconnect-btn")?.addEventListener("click", async () => {
  await chrome.storage.local.remove(["token"]);
  activeProfile = null;
  previewCard.classList.add("hidden");
  pairView.classList.remove("hidden");
  copilotView.classList.add("hidden");
  setStatus("Disconnected.");
});

void init();
