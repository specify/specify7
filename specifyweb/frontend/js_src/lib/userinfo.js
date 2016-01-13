"use strict";

var _              = require('underscore');
var initialContext = require('./initialcontext.js');

    var userInfo = {};
    initialContext.load('user.json', function(data) {
        _.extend(userInfo, data, {
            isReadOnly:  !_(['Manager', 'FullAccess']).contains(data.usertype)
        });
    });

module.exports = userInfo;
