"use strict";

import initialContext from './initialcontext';

    var prefs = {};

    initialContext.load('remoteprefs.properties', function(text) {
        text.split('\n').forEach(function(line) {
            if (/^#/.test(line)) return;
            var match = /([^=]+)=(.+)/.exec(line);
            match && (prefs[match[1]] = match[2]);
        });
    });

    export default prefs;

