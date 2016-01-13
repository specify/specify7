"use strict";


var _ = require('underscore');

    var fromRe = /FROM\s+(\w+)\s+(AS\s+)?(\w+)/i;
    var joinRe = /JOIN\s+(\w+\.\w+)\s+(AS\s+)?(\w+)/ig;
    var self = {
        parse: function(select) {
            var colMap = {};
            var match = select.match(fromRe);
            if (!match) throw new Error("no FROM clause");
            colMap[match[3]] = match[1];

            var tableDotField, col;
            while (match = joinRe.exec(select)) {
                tableDotField = match[1].split('.');
                col = colMap[tableDotField[0]];
                if (!col) throw new Error("undefined name:" + tableDotField[0]);
                colMap[match[3]] = col + '.' + tableDotField[1];
            }
            return colMap;
        },
        colToField: function(colMap, col) {
            col = col.split('.');
            if (col.length === 1) return col[0];
            var field = colMap[col[0]].split('.');
            field.push(col[1]);
            return _(field).tail().join('.');
        },
        colToFieldMapper: function(select) {
            return _.bind(self.colToField, self, self.parse(select));
        }
    };

module.exports = self;

