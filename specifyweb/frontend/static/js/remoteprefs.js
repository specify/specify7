define([
    'underscore', 'text!context/remoteprefs.properties!noinline'
], function(_, text) {
    "use strict";

    var lines = text.split('\n');
    var prefs = {};

    _.each(lines, function(line) {
        if (/^#/.test(line)) return;
        var match = /([^=]+)=(.+)/.exec(line);
        match && (prefs[match[1]] = match[2]);
    });

    return prefs;
});
