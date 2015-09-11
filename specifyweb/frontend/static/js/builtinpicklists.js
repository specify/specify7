define(['underscore'], function(_) {
    "use strict";

    return {
        agentType: _(['Organization', 'Person', 'Other', 'Group']).map(function(type, i) {
            return { value: i, title: type };
        }),
        userType: _(["Manager", "FullAccess", "LimitedAccess", "Guest"]).map(function(type) {
            return { value: type, title: type };
        }),
        typesCBX: _(['User Defined Items', 'Entire Table', 'Field From Table']).map(function(type, i) {
            return { value: i, title: type };
        })
    };
});

