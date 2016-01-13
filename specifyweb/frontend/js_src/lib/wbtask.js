"use strict";

var router = require('./router.js');

module.exports =  function() {
    router.route('workbench/:id/', 'workbench', function(id) {
        require.ensure(['./wbview.js'], function(require) {
            var loadWB = require('./wbview.js');
            loadWB(id);
        }, "wbview");
    });
};

