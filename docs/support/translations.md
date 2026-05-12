# Translations

Streamarr uses `react-intl` for internationalization. English strings are extracted from the codebase, and translated locale files are maintained through our self-hosted Weblate instance.

## Translation Workflow

1. If you are changing user-facing text in code, run:

   ```bash
   pnpm i18n:extract
   ```

2. Commit the updated English catalog alongside your code changes.

3. For translation work, use Weblate at [weblate.streamarr.dev](https://weblate.streamarr.dev/).

4. Keep translation changes focused on locale content. If the source text changed, update the code first so the extracted catalog stays in sync.

## Where Files Live

- Client strings: `src/i18n/locale/`
- Server strings: `server/i18n/locale/`

## Notes

- CI currently validates the client catalog sync for `src/i18n/locale/en.json`.
- Keep `server/i18n/locale/en.json` in sync as part of translation updates.
- Locale files are bundled during the server build, so translation updates are picked up automatically after deployment.
