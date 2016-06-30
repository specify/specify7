"use strict";

var router = require('./router.js');
const userInfo = require('./userinfo.js');

module.exports =  function() {
    if (userInfo.available_tasks.includes('Workbench')) {
        router.route('workbench/:id/', 'workbench', function(id) {
            require.ensure(['./wbview.js'], function(require) {
                var loadWB = require('./wbview.js');
                loadWB(id);
            }, "wbview");
        });
    }
};

