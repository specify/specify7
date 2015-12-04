define([
    'jquery', 'underscore', 'immutable', 'schema',
    'text!resources/specify_workbench_datamodel.xml!noinline',
    'text!resources/datamodel_automappings.xml!noinline'
], function($, _, Immutable, schema, wbDataModelXML, autoMappingXML) {
    "use strict";

    var wbDataModel = $.parseXML(wbDataModelXML);

    var tableInfos = _.map($('table', wbDataModel), function(tableNode) {
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

    var autoMapping = $.parseXML(autoMappingXML);

    var autoMappings = _.map(
        $('mapping', autoMapping), mappingNode => {
            var className = $('class', mappingNode).text();
            var fieldName = $('field', mappingNode).text();
            var regexes = _.map($('regex', mappingNode), reNode => RegExp($(reNode).text()));

            var tableInfo = _.find(tableInfos, ti => ti.className === className);
            var fieldInfo = _.find(tableInfo.fields, fi => fi.name === fieldName);

            return Object.freeze({
                regexes: regexes,
                fieldInfo: fieldInfo
            });
        });

    function autoMap(column, index) {
        var matched = _.find(autoMappings, am => _.any(am.regexes, re => re.test(column)));
        var fieldInfo = matched ? matched.fieldInfo : null;
        return Immutable.Map({column: column, fieldInfo: fieldInfo, origIndex: index, curIndex: index});
    }

    function autoMapColumns(columns) {
        return Immutable.List(columns).map(autoMap);
    }

    return {
        tableInfos: tableInfos,
        autoMap: autoMapColumns
    };
});
