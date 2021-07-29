'use strict';

var router = require('./router.js');

module.exports = function () {
  router.route('workbench-import/', 'workbench-import', () =>
    import('./wbimport').then((wbImport) => wbImport())
  );
};
