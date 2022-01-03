'use strict';

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
        shadow: '#0009',
        brand: {
          100: '#fdb',
          200: '#f94',
          300: '#f73',
        }
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
