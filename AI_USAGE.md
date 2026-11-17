# AI usage summary

## Tool used

GitHub Copilot, through the Copilot SDK in VS Code, was used as an AI coding assistant.

## How it helped

- Reviewed the starter app and README before changing the implementation.
- Helped add local wellness trackers, dashboard and trend analytics, accessibility and theme improvements, onboarding, data validation, sharing of an aggregate summary, import/export, and optional encryption.
- Helped identify and fix issues found by production builds and browser-based interaction checks.
- Added focused tests for legacy-data compatibility and imported-data validation.

## Review and limitations

- The implementation was checked with `npm test`, `npm run build`, and browser interactions for mood, sleep, water, insights, and history.
- Medication notifications require browser permission and the app to remain open; they are not background alarms.
- Encryption is optional and local to this browser. Passphrases are not recoverable, and a plain JSON export is not encrypted.
- The project intentionally remains local-only: it has no account service, cloud storage, or multi-device synchronization.
- Review the code and privacy behavior before using real health information; this app is not a medical record system.
