QUnit.config.autostart = false;
require(['tests/testlatlongutils'], function(testlatlongutils) {
    QUnit.start();
    testlatlongutils();
});
