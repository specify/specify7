"use strict";

var router = require('./router.js');

module.exports = function() {
    router.route('', 'welcome', function() {
        require.ensure(['./welcomeview.js'], function(require) {
            var welcomeView = require('./welcomeview.js');
            welcomeView();
        }, 'welcome');
    });
};
