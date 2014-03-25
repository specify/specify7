require({
    baseUrl: "/static/js",
    waitSeconds: 0,
    priority: ['jquery'],
    paths: {
        'jquery'         : "vendor/jquery-1.7.2",
        'jquery-ui'      : "vendor/jquery-ui-1.10.2.custom",
        'jquery-bbq'     : "vendor/jquery.ba-bbq",
        'underscore'     : "vendor/underscore",
        'backbone-orig'  : "vendor/backbone",
        'qunit'          : "vendor/qunit",
        'textbase'       : "vendor/text",
        'resources'      : '/static/config',
        'tmpls'          : '/static/html/templates',
        'context'        : '/context',
        'properties'     : '/properties',
        'd3'             : '//cdnjs.cloudflare.com/ajax/libs/d3/3.4.3/d3.min'
    },
    shim: {
        'jquery-ui'      : ['jquery'],
        'jquery-bbq'     : ['jquery'],
        'underscore'     : { exports: '_' },
        'backbone-orig'  : { deps: ['jquery', 'underscore'], exports: 'Backbone' }
    }
});

require(['jquery', 'specifyapp'], function($, app) { $(app.start()); });
