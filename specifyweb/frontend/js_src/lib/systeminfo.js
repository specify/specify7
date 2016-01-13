"use strict";

var _ = require('underscore');
var initialContext = require('./initialcontext.js');

    var systemInfo = {user_agent: window.navigator.userAgent};

    initialContext.load('system_info.json', function(data) {
        _.extend(systemInfo, data);
    });

module.exports =  systemInfo;

