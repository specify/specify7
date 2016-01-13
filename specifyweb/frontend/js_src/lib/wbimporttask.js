"use strict";

var router           = require('./router.js');

module.exports = function() {
    router.route('workbench-import/', 'workbench-import', function() {
        require.ensure(['./wbimport.js'], function(require) {
            var wbimport = require('./wbimport.js');
            wbimport();
        }, 'wbimport');
    });
};

