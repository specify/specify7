"use strict";

var $         = require('jquery');
var _         = require('underscore');
var Immutable = require('immutable');

var schema         = require('./schema.js');
var initialContext = require('./initialcontext.js');


    var wbDataModelXML, autoMappingXML, tableInfos, autoMappings, fieldInfosSortedForSimpleMatch;

    function getFieldsForTable(tableNode, tableInfo) {
        return _.map(tableNode.find('field'), function(fieldDef) {
            var $fieldDef = $(fieldDef);
            return Object.freeze({
                tableInfo: tableInfo,
                column: $fieldDef.attr('column'), // Default caption
                name: $fieldDef.attr('name'),     // Specify field name
                type: $fieldDef.attr('type'),     // Specify field type
                length: $fieldDef.attr('length')
            });
        });
    }

    function isDisallowedTable(mappedTables, tableName) {
        if (mappedTables.includes('agent')) {
            return tableName !== 'agent';
        } else if (mappedTables.includes('taxononly')) {
            return tableName !== 'taxononly';
        } else if (mappedTables.count() > 0) {
            return 'agent' === tableName || 'taxononly' === tableName;
        } else {
            return false;
        }
    }

    initialContext
        .loadResource('specify_workbench_datamodel.xml', data => wbDataModelXML = data)
        .loadResource('datamodel_automappings.xml', data => autoMappingXML = data)
        .promise().then(function() {
            console.log('parsing wb schema');

            tableInfos = wbSchema.tableInfos = _.map($('table', wbDataModelXML), function(tableNode) {
                tableNode = $(tableNode);
                var tableInfo = {
                    tableId: parseInt(tableNode.attr('tableid'), 10),
                    className: tableNode.attr('classname'),
                    name: tableNode.attr('table')
                };

                tableInfo.specifyModel = tableInfo.name === 'taxononly' ?
                    schema.models.Taxon :
                    schema.getModelById(tableInfo.tableId);

                tableInfo.title = tableInfo.name === 'taxononly' ?
                    'Taxon Import Only' :
                    tableInfo.specifyModel.getLocalizedName();

                tableInfo.fields = getFieldsForTable(tableNode, tableInfo);
                return Object.freeze(tableInfo);
            });

            autoMappings = _.map(
                $('mapping', autoMappingXML), mappingNode => {
                    var className = $('class', mappingNode).text();
                    var fieldName = $('field', mappingNode).text();
                    var regexes = _.map($('regex', mappingNode), reNode => new RegExp($(reNode).text()));

                    var tableInfo = _.find(tableInfos, ti => ti.className === className);
                    var fieldInfo = _.find(tableInfo.fields, fi => fi.name === fieldName);

                    return Object.freeze({
                        regexes: regexes,
                        fieldInfo: fieldInfo
                    });
                });


            fieldInfosSortedForSimpleMatch = _(tableInfos).chain()
                    .sortBy(ti => ti.name === 'taxononly' ? schema.models.Taxon.tableId : ti.tableId)
                    .map(ti => ti.fields)
                    .flatten()
                    .value();
        });

    function simpleMatch(mappedTables, column) {
        var lcColumn = column.toLowerCase();
        var noWSColumn = lcColumn.replace(/\s+/g, '');

        return _.find(
            fieldInfosSortedForSimpleMatch, fi => {
                var fName = fi.name.toLowerCase();
                var fCName = fi.column.toLowerCase();
                return !isDisallowedTable(mappedTables, fi.tableInfo.name) &&
                    (fName === noWSColumn ||
                     fCName === noWSColumn ||
                     fName.indexOf(lcColumn) === 0 ||
                     fCName.indexOf(lcColumn) === 0);
            });
    }

    function autoMap(mappedTables, column) {
        var matched = _.find(
            autoMappings, am =>
                !isDisallowedTable(mappedTables, am.fieldInfo.tableInfo.name) &&
                _.any(am.regexes, re => re.test(column)));

        return matched ? matched.fieldInfo : null;
    }

    function autoMapColumns(columns) {
        return columns.reduce((mappings, column, index) => {
            var mappedTables = mappings
                    .map(m => m.get('fieldInfo'))
                    .filter(fi => fi != null)
                    .map(fi => fi.tableInfo.name);

            return mappings.push(Immutable.Map({
                column: column,
                fieldInfo: simpleMatch(mappedTables, column) || autoMap(mappedTables, column),
                origIndex: index,
                curIndex: index
            }));
        }, Immutable.List());
    }

    var wbSchema = {
        tableInfos: undefined,
        autoMap: autoMapColumns,
        isDisallowedTable: isDisallowedTable
    };

module.exports =  wbSchema;

