define(['underscore', 'schema'], function(_, schema) {
    "use strict";

    var STRINGID_RE = /^([^\.]*)\.([^\.]*)\.(.*)$/;

    function stringIdToFieldSpec(stringId) {
        var match = STRINGID_RE.exec(stringId);
        var path = match[1].split(',');
        var tableName = match[2];
        var fieldName = match[3];
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
        var result = {
            joinPath: joinPath,
            table: node,
            datePart: extracted.datePart
        };


        var field = node.getField(extracted.fieldName);
        if (field) {
            result.joinPath.push(field);
            result.treeRank = null;
        } else {
            result.treeRank = extracted.fieldName;
            console.log("using fieldname as treerank", result.treeRank);
        }

        console.log("parsed", stringId, result);
        return result;
    }

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

    function forNewField(table) {
        return {
            joinPath: [],
            table: table,
            datePart: null,
            treeRank: null
        };
    }

    function makeTableList(fs, formattedRecord) {
        var path = (fs.treeRank || formattedRecord) ?
                fs.joinPath : _.initial(fs.joinPath);

        var first = [fs.table.tableId];
        var rest = _.map(path, function(field) {
            var relatedModel = field.getRelatedModel();
            return relatedModel.name.toLowerCase() === field.name.toLowerCase() ?
                relatedModel.tableId : (relatedModel.tableId + '-' + field.name.toLowerCase());
        });
        return first.concat(rest).join(',');
    }

    function makeStringId(fs, tableList) {
        var fieldName = fs.treeRank || _.last(fs.joinPath).name;
        if (fs.datePart) {
            fieldName += 'Numeric' + fs.datePart;
        }
        return [tableList, fs.table.name.toLowerCase(), fieldName];
    }

    function toSpQueryAttrs(fs, formattedRecord) {
        var tableList = makeTableList(fs, formattedRecord);
        var stringId = makeStringId(fs, tableList);

        return {
            tablelist: tableList,
            stringid: stringId.join('.'),
            fieldname: _.last(stringId),
            isrelfld: formattedRecord
        };
    }

    return {
        fromStringId: stringIdToFieldSpec,
        forNewField: forNewField,
        toSpQueryAttrs: toSpQueryAttrs
    };
});
