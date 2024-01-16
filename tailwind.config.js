// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: [
    './node_modules/react-tailwindcss-datepicker-sct/dist/index.esm.js',
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      transitionProperty: {
        'max-height': 'max-height',
        width: 'width',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.purple.300'),
            a: {
              color: theme('colors.purple.500'),
              '&:hover': {
                color: theme('colors.purple.400'),
              },
            },

            h1: {
              color: theme('colors.purple.300'),
            },
            h2: {
              color: theme('colors.purple.300'),
            },
            h3: {
              color: theme('colors.purple.300'),
            },
            h4: {
              color: theme('colors.purple.300'),
            },
            h5: {
              color: theme('colors.purple.300'),
            },
            h6: {
              color: theme('colors.purple.300'),
            },

            strong: {
              color: theme('colors.purple.400'),
            },

            code: {
              color: theme('colors.purple.300'),
            },

            figcaption: {
              color: theme('colors.purple.500'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
