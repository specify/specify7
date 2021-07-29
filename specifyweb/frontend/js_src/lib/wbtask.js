'use strict';

var router = require('./router.js');

module.exports = function () {
  router.route('workbench/:id/', 'workbench', function (id) {
    import('./wbview').then((WbView) => WbView(id));
  });
};
