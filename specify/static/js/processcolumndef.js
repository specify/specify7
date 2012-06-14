define(['jquery'], function($) {
    "use strict";
    // Return a table DOM node with <col> defined based
    // on the columnDef attr of a viewdef.
    return function(columnDef) {
        var table = $('<table>'), colgroup = $('<colgroup>').appendTo(table);
        $(columnDef.split(',')).each(function(i) {
            if (i%2 === 0) {
                var col = $('<col>').appendTo(colgroup),
                width = /(\d+)px/.exec(this);
                width && col.attr('width', width[1]+'px');
            }
        });
        return table;
    }

});