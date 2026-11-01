// Content script. In later phases this detects the current page's ATS (see
// the ats_connectors registry in docs/DATABASE_SCHEMA.md) and runs the
// Form-Mapping Agent described in docs/AI_AGENTS.md §5. Phase 0: no detection
// logic yet, just proof the content script injects.

console.debug("[ApplyPilot] content script loaded");
