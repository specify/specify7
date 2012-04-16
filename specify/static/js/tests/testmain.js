QUnit.config.autostart = false;

require({
    baseUrl: "/static/js",
    priority: ['jquery'],
    paths: {
        'jquery': "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery",
        'jquery-ui': "https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui",
        'jquery-bbq': "vendor/jquery.ba-bbq",
        'underscore': "vendor/underscore",
        'backbone': "vendor/backbone",
        'beautify-html': "vendor/beautify-html",
        'text': "vendor/text",
    }
});

require([
    'tests/testlatlongutils', 'tests/testapi', 'tests/testschema'
], function(testlatlongutils, testapi, testschema) {
    QUnit.start();
    testschema();
    testapi();
    testlatlongutils();
});
