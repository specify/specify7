import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const originalResolveFilename = require('module')._resolveFilename;

require('module')._resolveFilename = function (request, parent, isMain) {
  if (request.endsWith('.svg')) {
    return request;
  }
  return originalResolveFilename(request, parent, isMain);
};
