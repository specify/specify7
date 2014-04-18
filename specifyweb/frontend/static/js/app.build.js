({
    baseUrl: '.',
    name: 'main',
    inlineText: true,
    include: 'requireLib',
    paths: {
        'requireLib'     : "vendor/require",

        'jquery'         : "vendor/jquery-1.7.2",
        'jquery-ui'      : "vendor/jquery-ui-1.10.2.custom",
        'jquery-bbq'     : "vendor/jquery.ba-bbq",
        'underscore'     : "vendor/underscore",
        'backbone-orig'  : "vendor/backbone",
        'qunit'          : "vendor/qunit",
        'textbase'       : "vendor/text",
        'moment'         : "vendor/moment",
        'd3'             : "vendor/d3",
        'resources'      : '/static/config',
        'tmpls'          : '../html/templates',
        'context'        : '/context',
        'properties'     : '/properties'
    },
    shim: {
        'jquery-ui'      : ['jquery'],
        'jquery-bbq'     : ['jquery'],
        'underscore'     : { exports: '_' },
        'moment'         : { exports: 'moment' },
        'backbone-orig'  : { deps: ['jquery', 'underscore'], exports: 'Backbone' }
    }
})
