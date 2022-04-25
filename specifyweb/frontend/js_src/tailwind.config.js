'use strict';

/*
 * This config partially overwrites and extends the default Tailwind config:
 * https://github.com/tailwindlabs/tailwindcss/blob/master/stubs/defaultConfig.stub.js
 */

// TODO: evaluate usages of arbitrary values in class names
// eslint-disable-next-line unicorn/prefer-module
module.exports = {
  content: [
    './lib/components/**/*.tsx',
    './lib/*.{ts,js}',
  ],
  corePlugins: {
    float: false,
    clear: false,
    skew: false,
    caretColor: false,
    sepia: false,
  },
  darkMode: 'class',
  theme: {
    borderRadius: {
      none: '0px',
      xs: '0.125rem',
      sm: '0.25rem',
      DEFAULT: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.5rem',
      full: '9999px',
    },
    extend: {
      colors: {
        // Specify 7 orange colors:
        brand: {
          100: 'hsl(27deg 100% 82%)',
          200: 'hsl(27deg 100% 63%)',
          300: 'hsl(27deg 100% 55%)',
          400: 'hsl(27deg 100% 41%)',
          500: 'hsl(27deg 100% 22%)',
        },
        // Some in-between shades:
        gray: {
          350: 'hsl(218deg 12% 79%)',
        },
        yellow: {
          250: 'hsl(53deg 98% 72%)',
        },
        indigo: {
          350: 'hsl(232deg 92% 79%)',
        },
        neutral: {
          350: 'hsl(0deg 0% 73%)',
        },
      },
      spacing: {
        'table-icon': '1.25rem',
      },
      brightness: {
        70: '.7',
        80: '.8',
      },
      transitionDuration: {
        0: '0ms',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
  /*
   * Disable class name purge in development for convenience
   * NOTE: this significantly increases build times
   */
  ...(process.env.NODE_ENV === 'production'
    ? {}
    : {
        safelist: [{ pattern: /./ }],
      }),
};
