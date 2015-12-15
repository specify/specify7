define(['underscore', 'initialcontext'], function (_, initialContext) {
    "use strict";

    var systemInfo = {user_agent: window.navigator.userAgent};

    initialContext.load('system_info.json', function(data) {
        _.extend(systemInfo, data);
    });

    return systemInfo;
});
