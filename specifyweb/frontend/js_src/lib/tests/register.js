// See https://nodejs.org/api/module.html#customization-hooks

import { register } from 'node:module';

register('./registerMock.js', import.meta.url);
