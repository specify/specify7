import postcssPresetEnv from 'postcss-preset-env';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [postcssPresetEnv, tailwindcss, autoprefixer],
};
