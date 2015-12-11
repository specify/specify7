define([
    'underscore', 'initialcontext'
], function(_, initialContext) {
    "use strict";
    var prefs = {};

    initialContext.load('remoteprefs.properties', function(text) {
        text.split('\n').forEach(function(line) {
            if (/^#/.test(line)) return;
            var match = /([^=]+)=(.+)/.exec(line);
            match && (prefs[match[1]] = match[2]);
        });
    });

    return prefs;
});
