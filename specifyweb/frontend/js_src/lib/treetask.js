'use strict';

var router = require('./router.js');

module.exports = function () {
  router.route('tree/:table/', 'tree', (table) =>
    import('./treeview'.then((treeView) => treeView(table)))
  );
};
