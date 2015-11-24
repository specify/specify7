require({
    baseUrl: "/static/js",
    waitSeconds: 0,
    priority: ['jquery'],
    paths: {
        'jquery'         : "vendor/jquery-1.7.2",
        'jquery-ui'      : "vendor/jquery-ui-1.10.2.custom",
        'jquery-bbq'     : "vendor/jquery.ba-bbq",
        'jquery-ctxmenu' : "vendor/jquery.contextMenu.v1.6.6",
        'handsontable'   : "vendor/handsontable.full",
        'bacon'          : "//cdnjs.cloudflare.com/ajax/libs/bacon.js/0.7.82/Bacon",
        'underscore'     : "vendor/underscore",
        'backbone-orig'  : "vendor/backbone",
        'qunit'          : "vendor/qunit",
        'textbase'       : "vendor/text",
        'moment'         : "vendor/moment",
        'd3'             : "vendor/d3",
        'q'              : "vendor/q-1.4.1",
        'resources'      : '/static/config',
        'tmpls'          : '/static/html/templates',
        'context'        : '/context',
        'properties'     : '/properties'
    },
    shim: {
        'jquery-ui'      : ['jquery'],
        'jquery-bbq'     : ['jquery'],
        'jquery-ctxmenu' : ['jquery', 'jquery-ui'],
        'underscore'     : { exports: '_' },
        'moment'         : { exports: 'moment' },
        'handsontable'   : { exports: 'Handsontable' },
        'backbone-orig'  : { deps: ['jquery', 'underscore'], exports: 'Backbone' }
    }
});

require(['jquery', 'specifyapp'], function($, app) { $(app.start()); });
