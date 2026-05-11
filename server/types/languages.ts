export interface Language {
  code: string;
  display: string;
  nativeDisplay: string;
}

const languages = [
  { code: 'en' as const, display: 'English', nativeDisplay: 'English' },
  { code: 'es' as const, display: 'Spanish', nativeDisplay: 'Español' },
] satisfies Language[];

export type AvailableLocale = (typeof languages)[number]['code'];
export const availableLocales: readonly AvailableLocale[] = languages.map(
  (l) => l.code
);

export default languages;
