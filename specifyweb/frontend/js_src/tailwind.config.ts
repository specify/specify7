/*
 * This config partially overwrites and extends the default Tailwind config:
 * https://github.com/tailwindlabs/tailwindcss/blob/master/stubs/defaultConfig.stub.js
 */

import forms from '@tailwindcss/forms';
import type { Config } from 'tailwindcss';

/*
 * REFACTOR: https://tailwindcss.com/blog/tailwindcss-v3-3#css-variables-without-the-var
 * REFACTOR: https://tailwindcss.com/blog/tailwindcss-v3-4#style-children-with-the-variant
 * REFACTOR: https://tailwindcss.com/blog/tailwindcss-v3-4#subgrid-support
 * REFACTOR: https://tailwindcss.com/blog/tailwindcss-v3-4#extended-min-width-max-width-and-min-height-scales
 * REFACTOR: evaluate usages of arbitrary values in class names
 * REFACTOR: consider changing defaults for values (i.e ring-1)
 * REFACTOR: add col-span-{n} and col-span-[full-1]
 * REFACTOR: modify grid-col-{n} to resolve to grid-template-columns:repeat(n,auto)
 *    instead of grid-template-columns:repeat(n,1fr)
 */
const config: Config = {
  content: ['./lib/**/*.{ts,tsx,js}'],
  // Disable unneeded components to reduce performance impact
  corePlugins: {
    float: false,
    clear: false,
    skew: false,
    caretColor: false,
    sepia: false,
  },
  // Enable dark mode if body has "dark" class names
  darkMode: 'class',
  theme: {
    // Make default border radius more rounded
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
        // Specify brand colors
        brand: {
          100: 'var(--accent-color-100)',
          200: 'var(--accent-color-200)',
          300: 'var(--accent-color-300)',
          400: 'var(--accent-color-400)',
          500: 'var(--accent-color-500)',
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
        peach:{
          250: 'hsl(23deg, 92%, 75%)',
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
      keyframes: {
        'hue-rotate': {
          '0%': { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
      },
      animation: {
        'hue-rotate': '4s hue-rotate 2s linear infinite',
      },
    },
  },
  plugins: [forms],
};
export default config;
