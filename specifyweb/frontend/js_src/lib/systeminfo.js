"use strict";

var $ = require('jquery');
var _ = require('underscore');
var initialContext = require('./initialcontext.js');

    var systemInfo = {user_agent: window.navigator.userAgent};

    initialContext.load('system_info.json', function(data) {
        _.extend(systemInfo, data);
        if (systemInfo.stats_url != null) {
            $.get(systemInfo.stats_url, {
                version: systemInfo.version,
                dbVersion: systemInfo.database_version,
                institution: systemInfo.institution,
                institutionGUID: systemInfo.institution_guid,
                discipline: systemInfo.discipline,
                collection: systemInfo.collection,
                collectionGUID: systemInfo.collection_guid,
                isaNumber: systemInfo.isa_number
            }).fail(jqxhr => jqxhr.errorHandled = true);
        }
    });

module.exports =  systemInfo;

