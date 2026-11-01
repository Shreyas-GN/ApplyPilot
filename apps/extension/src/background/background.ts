// Service worker. Owns the extension<->backend connection (pairing, sync,
// reporting — see docs/API_DESIGN.md §5). Phase 0: no real pairing logic yet,
// just proof that the background script boots.

chrome.runtime.onInstalled.addListener(() => {
  console.log("[ApplyPilot] extension installed");
});
