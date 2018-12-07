"use strict";

var router = require('./router.js');

module.exports =  function() {
    router.route('tree/:table/', 'tree', function(table) {
        require.ensure(['./treeview.js'], function(require) {
            var treeview = require('./treeview.js');
            treeview(table);
        }, 'treeview');
    });
};

