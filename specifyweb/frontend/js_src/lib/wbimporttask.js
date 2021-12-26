'use strict';

const router = require('./router');
const app = require('./specifyapp');

module.exports = function () {
  router.route('workbench-import/', 'workbench-import', () =>
    import('./components/wbimport').then((WbImport) =>
        app.setCurrentView(new WbImport());
    )
  );
}
