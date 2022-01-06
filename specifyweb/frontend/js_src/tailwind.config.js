'use strict';

/*
 * This config partially overwrites and extends the default Tailwind config:
 * https://github.com/tailwindlabs/tailwindcss/blob/master/stubs/defaultConfig.stub.js
 */

// eslint-disable-next-line unicorn/prefer-module
module.exports = {
  content: [
    './lib/components/**/*.tsx',
    './lib/templates/*.html',
    './lib/*.{ts,js}',
  ],
  corePlugins: {
    float: false,
    clear: false,
    skew: false,
    caretColor: false,
    sepia: false,
  },
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // Specify 7 orange colors:
        brand: {
          100: 'hsl(27deg 100% 82%)',
          200: 'hsl(27deg 100% 63%)',
          300: 'hsl(27deg 100% 55%)',
        },
        // Some in-between shades:
        yellow: {
          250: 'hsl(53deg 98% 72%)',
        },
        indigo: {
          350: 'hsl(232deg 92% 79%)',
        },
      },
      spacing: {
        'table-icon': '1.25rem',
      },
      brightness: {
        70: '.7',
        80: '.8',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
  // Disable purge in development for convenience
  ...(process.env.NODE_ENV === 'production' ? {} : {
    safelist: [
      {pattern: /./},
    ],
  }),
}
