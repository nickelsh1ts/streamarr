import type { Theme } from '@server/lib/settings';
import { colord } from 'colord';
import colors from 'tailwindcss/colors';

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

// Convert from OKLCH to sRGB (0-255)
export const oklchToRgb = (L: number, C: number, hDeg: number) => {
  const h = (hDeg * Math.PI) / 180;
  const a = Math.cos(h) * C;
  const b = Math.sin(h) * C;

  // Convert OKLab to linear LMS as per the OKLab spec inverse
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // Linear sRGB
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const linearToSrgb = (c: number) => {
    // clamp
    c = Math.max(0, Math.min(1, c));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };

  const r = Math.round(linearToSrgb(lr) * 255);
  const g = Math.round(linearToSrgb(lg) * 255);
  const bOut = Math.round(linearToSrgb(lb) * 255);

  return { r, g, b: bOut };
};

export const parseColorToHex = (value: string): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  const oklchMatch = trimmed.match(
    /oklch\(\s*([0-9]*\.?[0-9]+%?)\s+([0-9]*\.?[0-9]+%?)\s+([0-9]*\.?[0-9]+(?:deg)?%?)\s*\)/i
  );
  if (oklchMatch) {
    const Lraw = oklchMatch[1];
    const Craw = oklchMatch[2];
    const Hraw = oklchMatch[3];
    const L = Lraw.endsWith('%') ? parseFloat(Lraw) / 100 : parseFloat(Lraw);
    const C = Craw.endsWith('%') ? parseFloat(Craw) / 100 : parseFloat(Craw);
    const H = parseFloat(Hraw.replace(/deg/i, '').replace(/%/g, ''));
    const rgb = oklchToRgb(L, C, H);
    return colord({ r: rgb.r, g: rgb.g, b: rgb.b }).toHex();
  }
  const c = colord(trimmed);
  return c.isValid() ? c.toHex() : null;
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
