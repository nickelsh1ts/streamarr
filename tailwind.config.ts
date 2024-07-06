// eslint-disable-next-line @typescript-eslint/no-unused-vars
import defaultTheme from 'tailwindcss/defaultTheme';
import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'selector',
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      transitionProperty: {
        'max-height': 'max-height',
        width: 'width',
      },
      colors: {
        fox: '#F58A07',
        "brand-dark": "#080011",
        "brand-light": "#2b0b53",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        streamarr: {
          "primary": "#974ede",
          "primary-content": "#e9ddfb",
          "secondary": "#2b0b53",
          "secondary-content": "#cfcbdc",
          "accent": "#e5a00d",
          "accent-content": "#120900",
          "neutral": "#6c757d",
          "neutral-content": "#e0e2e4",
          "base-100": "#121212",
          "base-200": "#121418",
          "base-300": "#0d1013",
          "base-content": "#cacbcc",
          "info": "#2563eb",
          "info-content": "#d2e2ff",
          "success": "#84cc16",
          "success-content": "#060f00",
          "warning": "#eab308",
          "warning-content": "#130c00",
          "error": "#b91c1c",
          "error-content": "#fff",
        },
      },
    ],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
} satisfies Config;
