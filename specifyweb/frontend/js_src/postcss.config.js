const tailwindcss = require('tailwindcss');

module.exports = {
  plugins: [
    'postcss-preset-env',
    tailwindcss,
    ...(NODE_ENV === 'production' ? { cssnano: {} } : {})
  ],
};