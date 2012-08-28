({
    baseUrl: '.',
    name: 'main',
    out: 'main-built.js',
    inlineText: false,
    paths: {
        'jquery'         : "vendor/jquery-1.7.2",
        'jquery-ui'      : "vendor/jquery-ui",
        'jquery-bbq'     : "vendor/jquery.ba-bbq",
        'jquery-mockjax' : "vendor/jquery.mockjax",
        'underscore'     : "vendor/underscore",
        'backbone'       : "vendor/backbone",
        'qunit'          : "vendor/qunit",
        'beautify-html'  : "vendor/beautify-html",
        'CoffeeScript'   : "vendor/CoffeeScript",
        'cs'             : "vendor/cs",
        'text'           : "vendor/text",
        'resources'      : '/static/config',
        'tmpls'          : '/static/html/templates',
        'context'        : '/context',
        'properties'     : '/properties'
    },
    shim: {
        'jquery-ui'      : ['jquery'],
        'jquery-bbq'     : ['jquery'],
        'jquery-mockjax' : ['jquery'],
        'backbone'       : { deps: ['jquery', 'underscore'], exports: 'Backbone' },
        'qunit'          : { deps: ['jquery'], exports: 'QUnit' }
    }
})
