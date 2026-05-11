import { createRequire } from 'node:module';
import moment from 'moment';
import { availableLocales } from '@server/types/languages';

const requireModule = createRequire(__filename);

// Synchronously register moment locale data for every supported locale.
// Skips 'en' — moment bundles English by default.
// When a new locale is added to server/types/languages.ts, it is picked up automatically.
for (const locale of availableLocales) {
  if (locale !== 'en') {
    requireModule(`moment/locale/${locale}`);
  }
}

export { moment as default };
