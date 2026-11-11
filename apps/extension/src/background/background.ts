interface ExtensionConfig {
  apiBaseUrl: string;
  token: string;
}

const DEFAULT_API_BASE = "http://localhost:3000";

async function getConfig(): Promise<ExtensionConfig | null> {
  const stored = await chrome.storage.local.get(["apiBaseUrl", "token"]);
  if (typeof stored.token === "string" && stored.token.length > 0) {
    return {
      apiBaseUrl:
        typeof stored.apiBaseUrl === "string" && stored.apiBaseUrl.trim()
          ? stored.apiBaseUrl.replace(/\/+$/, "")
          : DEFAULT_API_BASE,
      token: stored.token,
    };
  }
  return null;
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("[ApplyPilot] extension installed");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "APPLYPILOT_FETCH_PROFILE") {
    (async () => {
      const config = await getConfig();
      const baseUrl = (message.apiBaseUrl || config?.apiBaseUrl || DEFAULT_API_BASE).replace(/\/+$/, "");
      const token = message.token || config?.token;
      if (!token) {
        sendResponse({ ok: false, error: "Not paired yet." });
        return;
      }

      const res = await fetch(`${baseUrl}/api/ext/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        sendResponse({ ok: false, error: data?.detail || `HTTP ${res.status}` });
        return;
      }
      sendResponse({ ok: true, data });
    })().catch((err: unknown) => {
      sendResponse({
        ok: false,
        error: err instanceof Error ? err.message : "Network error",
      });
    });
    return true;
  }

  if (message?.type === "APPLYPILOT_CAPTURE_APP") {
    (async () => {
      const config = await getConfig();
      if (!config) {
        sendResponse({ ok: false, error: "Extension is not paired." });
        return;
      }

      const res = await fetch(`${config.apiBaseUrl}/api/ext/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.token}`,
        },
        body: JSON.stringify(message.payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        sendResponse({ ok: false, error: data?.detail || `HTTP ${res.status}` });
        return;
      }
      sendResponse({ ok: true, data });
    })().catch((err: unknown) => {
      sendResponse({
        ok: false,
        error: err instanceof Error ? err.message : "Network error",
      });
    });
    return true;
  }

  return false;
});
