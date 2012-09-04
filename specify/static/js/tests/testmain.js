require({
    baseUrl: "/static/js",
    priority: ['jquery'],
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
        'context'        : '/testcontext',
        'properties'     : '/static/js/tests/fixtures/properties'
    },
    shim: {
        'jquery-ui'      : ['jquery'],
        'jquery-bbq'     : ['jquery'],
        'jquery-mockjax' : ['jquery'],
        'backbone'       : { deps: ['jquery', 'underscore'], exports: 'Backbone' },
        'qunit'          : { deps: ['jquery'], exports: 'QUnit' }
    }
});

require([
    'underscore', 'qunit', 'cs!tests/setupmockjax',
    'tests/testlatlongutils',
    'tests/testapi',
    'tests/testschema',
    'tests/testparseselect',
    'tests/testuiformatters',
    'tests/testuiparse',
    'tests/testforms',
    'cs!tests/testbusinessrules',
//    'cs!tests/testquerycbx'
], function testmain(_, QUnit, setupmockjax) {
    setupmockjax();
    QUnit.config.reorder = false;
    QUnit.config.autorun = false;
    var tests = _(arguments).chain().tail(testmain.length);
    tests.invoke('apply');
});
