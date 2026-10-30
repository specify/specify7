// See https://nodejs.org/api/module.html#customization-hooks

import Module, { register } from 'node:module';

register('./registerMock.js', import.meta.url);

/*
 * The resolve hook above only applies to ESM imports. CommonJS dependencies
 * (i.e, m-react-splitters) require() asset files directly, and Node.js falls
 * back to the ".js" handler for unknown extensions, which fails to parse them
 */
for (const extension of ['.css', '.png', '.svg'])
  Module._extensions[extension] = (module) => {
    module.exports = 'test-file-stub';
  };
