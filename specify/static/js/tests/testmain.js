QUnit.config.autostart = false;

require({
    baseUrl: "/static/js",
    priority: ['jquery'],
    paths: {
        'jquery': "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery",
        'jquery-ui': "https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui",
        'jquery-bbq': "vendor/jquery.ba-bbq",
        'jquery-mockjax': "vendor/jquery.mockjax",
        'underscore': "vendor/underscore",
        'backbone': "vendor/backbone",
        'beautify-html': "vendor/beautify-html",
        'CoffeeScript': "vendor/CoffeeScript",
        'cs': "vendor/cs",
        'text': "vendor/text",
        'resources': '/static/resources',
        'tmpls': '/static/html/templates'
    }
});

require([
    'underscore', 'cs!tests/setupmockjax',
    'tests/testlatlongutils',
    'tests/testapi',
    'tests/testschema',
    'tests/testparseselect',
    'tests/testuiformatters',
    'tests/testuiparse',
    'tests/testforms',
    'cs!tests/testbusinessrules',
//    'cs!tests/testquerycbx'
], function testmain(_, setupmockjax) {
    setupmockjax();

    QUnit.start();
    var tests = _(arguments).chain().tail(testmain.length);
    tests.invoke('apply');
});
