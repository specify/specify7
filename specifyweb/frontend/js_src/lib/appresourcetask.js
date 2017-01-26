"use strict";

const router = require('./router.js');


function appResource(id) {
    require.ensure(['./appresources.js'],
                   require => require('./appresources.js')(Number(id)),
                   'appresources');
}

module.exports = function() {
    router.route('appresources/', 'appresources', appResource);
    router.route('appresources/:id/', 'appresource', appResource);
};

