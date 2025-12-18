/* eslint-disable @typescript-eslint/no-require-imports */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import defaultTheme from 'tailwindcss/defaultTheme';
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', './public/**/*.html'],
  darkMode: 'selector',
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        '3xl': '0rem 0.25rem 1rem 0rem #00000033',
      },
      transitionProperty: {
        'max-height': 'max-height',
        width: 'width',
      },
      colors: {
        fox: '#F58A07',
        'brand-dark': '#080011',
        'brand-light': '#2b0b53',
      },
      animation: {
        enter: 'enter 200ms ease-out',
        'slide-in': 'slide-in 0.3s cubic-bezier(.41,.73,.51,1.02)',
        leave: 'leave 150ms ease-in forwards',
      },
      keyframes: {
        enter: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        leave: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.9)', opacity: '0' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        streamarr: {
          primary: '#974ede',
          'primary-content': '#fff',
          secondary: '#2b0b53',
          'secondary-content': '#cfcbdc',
          accent: '#e5a00d',
          'accent-content': '#fff',
          neutral: '#6c757d',
          'neutral-content': '#e0e2e4',
          'base-100': '#121212',
          'base-200': '#121418',
          'base-300': '#0d1013',
          'base-content': '#fff',
          info: '#2563eb',
          'info-content': '#d2e2ff',
          success: '#84cc16',
          'success-content': '#fff',
          warning: '#ffc107',
          'warning-content': '#fff',
          error: '#b91c1c',
          'error-content': '#fff',
        },
      },
    ],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    prefix: '',
    logs: true,
    themeRoot: ':root',
  },
} satisfies Config;
