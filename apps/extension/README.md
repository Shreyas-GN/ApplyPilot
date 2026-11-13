# @applyfocus/extension

Phase 0 scaffold only — boots, builds, and loads as an unpacked Manifest V3 extension,
but has no pairing, detection, or form-fill logic yet. That lands in Phase 6
(`docs/MVP_ROADMAP.md`).

Known placeholder that must be revisited before Phase 6 ships:
`manifest.json`'s `content_scripts.matches` is currently `https://*/*` (broad) purely so
the stub content script has something to inject into during local testing. Once the
`ats_connectors` registry (`docs/DATABASE_SCHEMA.md`) has real entries, this should be
narrowed to the actual Tier-1/Tier-2 host list rather than shipped broad to the Chrome Web
Store.

## Local build

```bash
pnpm --filter @applyfocus/extension build
```

Then load `apps/extension/dist` as an unpacked extension in `chrome://extensions`.
