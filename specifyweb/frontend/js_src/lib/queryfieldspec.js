"use strict";

var _ = require('underscore');

var schema = require('./schema.js');

    var STRINGID_RE = /^([^\.]*)\.([^\.]*)\.(.*)$/;

    var DATE_PART_RE = /(.*)((NumericDay)|(NumericMonth)|(NumericYear))$/;

    function extractDatePart(fieldName) {
        var match = DATE_PART_RE.exec(fieldName);
        return match ? {
            fieldName: match[1],
            datePart: match[2].replace('Numeric', '')
        } : {
            fieldName: fieldName,
            datePart: null
        };
    }

    function makeTableList(fs) {
        var path = (fs.treeRank || (fs.joinPath.length === 0) || fs.isRelationship()) ?
                fs.joinPath : _.initial(fs.joinPath);

        var first = [fs.rootTable.tableId];
        var rest = _.map(path, function(field) {
            var relatedModel = field.getRelatedModel();
            return relatedModel.name.toLowerCase() === field.name.toLowerCase() ?
                relatedModel.tableId : (relatedModel.tableId + '-' + field.name.toLowerCase());
        });
        return first.concat(rest).join(',');
    }

    function makeStringId(fs, tableList) {
        var fieldName = fs.treeRank || (fs.joinPath.length ? _.last(fs.joinPath).name : '');
        if (fs.datePart && fs.datePart !== "Full Date") {
            fieldName += 'Numeric' + fs.datePart;
        }
        return [tableList, fs.table.name.toLowerCase(), fieldName];
    }

    function QueryFieldSpec(rootTable) {
        _(this).extend({
            rootTable: rootTable,
            joinPath: [],
            table: rootTable,
            datePart: null,
            treeRank: null
        });
    }

    QueryFieldSpec.fromPath = function(pathIn) {
        var path = pathIn.slice();
        var rootTable = schema.getModel(path.shift());

        var joinPath = [];
        var node = rootTable;
        while (path.length > 0) {
            (function() {
                var fieldName = path.shift();
                var field = node.getField(fieldName);
                joinPath.push(field);
                if (field.isRelationship) {
                    node = field.getRelatedModel();
                } else if (path.length > 0) {
                    throw new Error("bad query field spec path");
                }
            })();
        }

        return _.extend(new QueryFieldSpec(rootTable), {
            joinPath: joinPath,
            table: node,
            datePart: (joinPath.length && _.last(joinPath).isTemporal()) ? 'Full Date' : null,
            treeRank: null
        });
    };

    QueryFieldSpec.fromStringId = function(stringId, isRelationship) {
        var match = STRINGID_RE.exec(stringId);
        var path = match[1].split(',');
        var tableName = match[2];
        var fieldName = match[3];

        isRelationship && path.pop();
        var rootTable = schema.getModelById(parseInt(path.shift(), 10));

        var joinPath = [];
        var node = rootTable;
        _.each(path, function(elem) {
            var tableId_fieldName = elem.split('-');
            var table = schema.getModelById(parseInt(tableId_fieldName[0], 10));
            var fieldName = tableId_fieldName[1];
            var field = _.isUndefined(fieldName) ? node.getField(table.name) : node.getField(fieldName);
            joinPath.push(field);
            node = table;
        });

        var extracted = extractDatePart(fieldName);
        var field = node.getField(extracted.fieldName);
        var treeRank = null;
        var datePart = extracted.datePart;

        if (field == null) {
            treeRank = extracted.fieldName;
            console.log("using fieldname as treerank", treeRank);
        } else {
            joinPath.push(field);
            field.isTemporal() && datePart || ( datePart = "Full Date" );
        }

        var result = _.extend(new QueryFieldSpec(rootTable), {
            joinPath: joinPath,
            table: node,
            datePart: datePart,
            treeRank: treeRank
        });
        console.log("parsed", stringId, "related", isRelationship, result);
        return result;
    };

    _.extend(QueryFieldSpec.prototype, {
        toSpQueryAttrs: function() {
            var tableList = makeTableList(this);
            var stringId = makeStringId(this, tableList);

            return {
                tablelist: tableList,
                stringid: stringId.join('.'),
                fieldname: _.last(stringId),
                isrelfld: this.isRelationship()
            };
        },
        getField: function() {
            return _.last(this.joinPath);
        },
        isRelationship: function() {
            return !this.treeRank && !!this.getField() && this.getField().isRelationship;
        },
        isTemporal: function() {
            var field = this.getField();
            return field && field.isTemporal();
        }
    });

module.exports =  QueryFieldSpec;

