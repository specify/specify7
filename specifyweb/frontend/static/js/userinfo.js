define(['underscore', 'initialcontext'], function (_, initialContext) {
    "use strict";

    var userInfo = {};
    initialContext.load('user.json', function(data) {
        _.extend(userInfo, data, {
            isReadOnly:  !_(['Manager', 'FullAccess']).contains(data.usertype)
        });
    });

    return userInfo;
});
