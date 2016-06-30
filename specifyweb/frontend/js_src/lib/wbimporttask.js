"use strict";

const router = require('./router.js');
const userInfo = require('./userinfo.js');

module.exports = function() {
    if (userInfo.available_tasks.includes('Workbench')) {
        router.route('workbench-import/', 'workbench-import', function() {
            require.ensure(['./wbimport.js'], function(require) {
                var wbimport = require('./wbimport.js');
                wbimport();
            }, 'wbimport');
        });
    }
};

