import { colord } from 'colord';

// Convert from OKLCH to sRGB (0-255).
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

/**
 * Normalizes any theme color string (hex, rgb, hsl, or oklch(...)) to a hex
 * string, or null when it cannot be parsed. Lives under @server so both the
 * client theme utilities (src/utils/themeUtils) and the in-process Seerr proxy
 * convert colors identically.
 */
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
