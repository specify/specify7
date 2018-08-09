"use strict";

var $ = require('jquery');
var _ = require('underscore');

    function reForKey(key) {
        return RegExp('^' + key + '\\s*[\\s=:]\\s*(.*)$', 'm');
    }

    function unescape(value) {
        return $.parseJSON('"' + value.replace(/\"/g, '\\"') + '"');
    }

module.exports = {
        getProperty: function(properties, key) {
            var match = reForKey(key).exec(properties);
            if (match) {
                console.debug('found value:', match[1], 'for key:', key);
                return match[1] && unescape(match[1]);
            } else {
                console.debug('properties set does not include', key);
                return undefined;
            }
        }
    };

