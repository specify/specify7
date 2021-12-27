"use strict";

import $ from 'jquery';
import _ from 'underscore';

import template from './templates/formdeftemplate.html';

    // Return a table DOM node with <col> defined based
    // on the columnDef attr of a viewdef.
export default function(columnDef) {
        return $(template({
            widths: _(columnDef.split(',')).chain()
                .filter(function(def, ind) { return ind%2 === 0; })
                .map(function(def) {
                    var width = /(\d+)px/.exec(def);
                    return width && width[1];
                }).value()
        }));
    };
