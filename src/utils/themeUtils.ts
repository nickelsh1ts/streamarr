import type { Theme } from '@server/lib/settings';
import { oklchToRgb, parseColorToHex } from '@server/utils/themeColor';
import colors from 'tailwindcss/colors';

export { oklchToRgb, parseColorToHex };

export const srgbToLinear = (c: number) => {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

export const getAllTailwindColors = (): string[] => {
  const allColors: string[] = [];
  const excludeColors = [
    'sky',
    'stone',
    'neutral',
    'gray',
    'slate',
    'inherit',
    'current',
    'transparent',
    'black',
    'white',
  ];

  // Tailwind v4 exposes its palette as oklch() strings, but the color picker
  // (react-colorful / colord) operates on hex, so normalize every preset to a
  // hex value here and drop anything that cannot be parsed.
  const addColor = (value: string) => {
    const hex = parseColorToHex(value);
    if (hex) {
      allColors.push(hex);
    }
  };

  Object.entries(colors).forEach(([colorName, colorShades]) => {
    if (excludeColors.includes(colorName)) return;
    if (typeof colorShades === 'object' && colorShades !== null) {
      Object.values(colorShades).forEach((shade) => {
        if (typeof shade === 'string') {
          addColor(shade);
        }
      });
    }
  });

  // Add black and white separately
  addColor(colors.black);
  addColor(colors.white);

  return allColors;
};

export const rgbToOklch = (r: number, g: number, b: number) => {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.sqrt(a * a + b_ * b_);
  let h = (Math.atan2(b_, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return { l: L, c: C, h };
};

export const daisyUIMapping: Record<string, string> = {
  primary: '--color-primary',
  'primary-content': '--color-primary-content',
  secondary: '--color-secondary',
  'secondary-content': '--color-secondary-content',
  accent: '--color-accent',
  'accent-content': '--color-accent-content',
  neutral: '--color-neutral',
  'neutral-content': '--color-neutral-content',
  'base-100': '--color-base-100',
  'base-200': '--color-base-200',
  'base-300': '--color-base-300',
  'base-content': '--color-base-content',
  info: '--color-info',
  'info-content': '--color-info-content',
  success: '--color-success',
  'success-content': '--color-success-content',
  warning: '--color-warning',
  'warning-content': '--color-warning-content',
  error: '--color-error',
  'error-content': '--color-error-content',
};

export const setIframeTheme = (innerFrame: Window, theme: Theme) => {
  if (
    !innerFrame.document ||
    !innerFrame.document.documentElement ||
    theme == null
  ) {
    return;
  }
  innerFrame.document.documentElement.setAttribute('data-theme', 'streamarr');
  Object.entries(theme).forEach(([key, value]) => {
    const daisyVar = daisyUIMapping[key];
    if (daisyVar) {
      const hex = parseColorToHex(value);
      if (hex) {
        innerFrame.document.documentElement.style.setProperty(daisyVar, hex);
      }
    }
  });
};
