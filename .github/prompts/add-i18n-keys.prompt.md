---
description: 'Add translation keys to both en and pl locale files for a new feature'
agent: 'agent'
argument-hint: "Feature namespace and keys, e.g. 'stats: title, description, noData'"
---

Add i18n translation keys for the specified feature. Follow these steps:

1. **Determine the correct JSON file** — translations are split by domain:
   - `common.json` — shared labels (save, cancel, delete)
   - `calendar.json`, `chat.json`, `diary.json`, `dashboard.json`, etc.
   - Create a new JSON file only if the feature doesn't fit existing files

2. **Add keys to English** in [src/i18n/locales/en/](src/i18n/locales/en/):
   - Use dot.notation nesting: `{ "feature": { "keyName": "English text" } }`
   - If adding to a new file, also update [src/i18n/locales/en/index.ts](src/i18n/locales/en/index.ts) to import and spread it

3. **Add keys to Polish** in [src/i18n/locales/pl/](src/i18n/locales/pl/):
   - Mirror the exact same key structure
   - Provide natural Polish translations (not machine-translated placeholders)
   - If adding to a new file, also update [src/i18n/locales/pl/index.ts](src/i18n/locales/pl/index.ts)

4. **Verify** both locale index files export the new namespace.

Key naming: `feature.subFeature.actionOrLabel` — e.g. `calendar.addEventButton`, `settings.profile.displayName`.
