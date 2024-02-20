import postcssPresetEnv from 'postcss-preset-env';
import tailwindcss from 'tailwindcss';

export default {
  plugins: [
    postcssPresetEnv({
      features: {
        // Disable warning about "Complex selectors"
        'is-pseudo-class': false,
      },
    }),
    tailwindcss,
  ],
};
