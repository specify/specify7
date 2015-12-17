"use strict";

var $ = require('jquery');
var _ = require('underscore');

var templates = require('./templates.js');

    // Return a table DOM node with <col> defined based
    // on the columnDef attr of a viewdef.
module.exports = function(columnDef) {
        return $(templates.formdef({
            widths: _(columnDef.split(',')).chain()
                .filter(function(def, ind) { return ind%2 === 0; })
                .map(function(def) {
                    var width = /(\d+)px/.exec(def);
                    return width && width[1];
                }).value()
        }));
    };
