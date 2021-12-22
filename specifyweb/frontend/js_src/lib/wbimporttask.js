'use strict';

const router = require('./router');
const app = require('./specifyapp');

module.exports = function () {
  router.route('workbench-import/', 'workbench-import', function () {
    require.ensure(
      ['./components/wbimport'],
      function (require) {
        const WbImport = require('./components/wbimport').default;
        app.setCurrentView(new WbImport());
      },
      'wbimport'
    );
  });
};
