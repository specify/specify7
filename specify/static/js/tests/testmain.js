QUnit.config.autostart = false;
require.config({
    baseUrl: "/static/js",
    paths: {
        underscore: "vendor/underscore",
    }
});

require(['tests/testlatlongutils'], function(testlatlongutils) {
    QUnit.start();
    testlatlongutils();
});
