"use strict";

var $         = require('jquery');
var _         = require('underscore');
var Q         = require('q');
var Immutable = require('immutable');

var schema = require('./schema.js');

function getFieldsForTable(uploadInfos, fieldNodes, tableInfo) {
    return _.map(fieldNodes, function(fieldDef) {
        const $fieldDef = $(fieldDef);
        const fieldInfo = {
            tableInfo: tableInfo,
            column: $fieldDef.attr('column'), // Default caption
            name: $fieldDef.attr('name'),     // Specify field name
            type: $fieldDef.attr('type'),     // Specify field type
            length: $fieldDef.attr('length'),
            uploadInfo: uploadInfos[`${tableInfo.name.toLowerCase()}.${$fieldDef.attr('name').toLowerCase()}`]
        };
        const localization = tableInfo.localization && tableInfo.localization.items[fieldInfo.name.toLowerCase()];
        const mappedField = fieldInfo.uploadInfo ?
                  fieldInfo.uploadInfo.fieldInfo :
                  schema.getModel(tableInfo.name) && schema.getModel(tableInfo.name).getField(fieldInfo.name);

        fieldInfo.title = "";
        if (mappedField) {
            if (mappedField.model.tableId !== tableInfo.tableId) {
                fieldInfo.title = mappedField.model.getLocalizedName() + " ";
            }
            fieldInfo.title += mappedField.getLocalizedName();
            if (fieldInfo.uploadInfo && fieldInfo.uploadInfo.sequence != null) {
                fieldInfo.title += " " + (1 + fieldInfo.uploadInfo.sequence);
            }
        } else {
            fieldInfo.title = localization ? localization.name : fieldInfo.column;
        }

        return Object.freeze(fieldInfo);
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

function simpleMatch(fieldInfosSortedForSimpleMatch, mappedFields, mappedTables, column) {
    var lcColumn = column.toLowerCase();
    var noWSColumn = lcColumn.replace(/\s+/g, '');

    return _.find(
        fieldInfosSortedForSimpleMatch, fi => {
            var fName = fi.name.toLowerCase();
            var fCName = fi.column.toLowerCase();
            return !mappedFields.contains(fi) &&
                !isDisallowedTable(mappedTables, fi.tableInfo.name) &&
                (fName === noWSColumn ||
                 fCName === noWSColumn ||
                 fName.indexOf(lcColumn) === 0 ||
                 fCName.indexOf(lcColumn) === 0);
        });
}

function autoMap(autoMappings, mappedFields, mappedTables, column) {
    var matched = _.find(
        autoMappings, am =>
            !mappedFields.contains(am.fieldInfo) &&
            !isDisallowedTable(mappedTables, am.fieldInfo.tableInfo.name) &&
            _.any(am.regexes, re => re.test(column)));

    return matched ? matched.fieldInfo : null;
}

function autoMapColumns(autoMappings, fisfsm, columns) {
    return columns.reduce((mappings, column, index) => {
        const mappedFields = mappings
                  .map(m => m.get('fieldInfo'))
                  .filter(fi => fi != null);

        const mappedTables = mappedFields.map(fi => fi.tableInfo.name);


        return mappings.push(Immutable.Map({
            column: column,
            fieldInfo: (simpleMatch(fisfsm, mappedFields, mappedTables, column) ||
                        autoMap(autoMappings, mappedFields, mappedTables, column)),
            origIndex: index,
            curIndex: index
        }));
    }, Immutable.List());
}

const loadUploadDefs = () => Q(
    $.get('/static/config/specify_workbench_upload_def.xml')
).then(uploadDefXML => _.object(
    _.map($('field', uploadDefXML), fieldNode => {
        const $fieldNode = $(fieldNode);
        const table = $fieldNode.attr('table').toLowerCase();
        const actualtable = $fieldNode.attr('actualtable');
        const name = $fieldNode.attr('name').toLowerCase();
        const actualname = $fieldNode.attr('actualname');
        const tableInfo = schema.getModel(actualtable || table);
        const fieldInfo = tableInfo && actualname && tableInfo.getField(actualname);
        const sequence = $fieldNode.attr('onetomanysequence');
        return fieldInfo && [
            `${table}.${name}`,
            {fieldInfo: fieldInfo, sequence: sequence && parseInt(sequence, 10)}
        ];
    }).filter(info => info != null)
));

const loadTableInfos = (localizationQ, uploadInfosQ) => Q.all([
    localizationQ, uploadInfosQ, $.get('/static/config/specify_workbench_datamodel.xml')
]).spread((localizations, uploadInfos, dataModelXML) => _.map($('table', dataModelXML), tableNode => {
    tableNode = $(tableNode);
    const tableInfo = {
        tableId: parseInt(tableNode.attr('tableid'), 10),
        className: tableNode.attr('classname'),
        name: tableNode.attr('table'),
        localization: localizations[tableNode.attr('table').toLowerCase()]
    };

    tableInfo.specifyModel = tableInfo.name === 'taxononly' ?
        schema.models.Taxon :
        schema.getModelById(tableInfo.tableId);

    tableInfo.title = tableInfo.name === 'taxononly' ?
        'Taxon Import Only' :
        tableInfo.localization ?
        tableInfo.localization.name :
        tableInfo.specifyModel.getLocalizedName();

    tableInfo.fields = getFieldsForTable(uploadInfos, tableNode.find('field'), tableInfo);
    return Object.freeze(tableInfo);
}));

const loadAutoMappings = (tableInfosQ) => Q.all([
    tableInfosQ, $.get('/static/config/datamodel_automappings.xml')
]).spread((tableInfos, autoMappingXML) => _.map($('mapping', autoMappingXML), mappingNode => {
    var className = $('class', mappingNode).text();
    var fieldName = $('field', mappingNode).text();
    var regexes = _.map($('regex', mappingNode), reNode => new RegExp($(reNode).text()));

    var tableInfo = _.find(tableInfos, ti => ti.className === className);
    var fieldInfo = _.find(tableInfo.fields, fi => fi.name === fieldName);

    return Object.freeze({
        regexes: regexes,
        fieldInfo: fieldInfo
    });
}));

function load() {
    const uploadInfosQ = loadUploadDefs();
    const localizationQ = Q($.get('/context/wb_schema_localization.json'));
    const tableInfosQ = loadTableInfos(localizationQ, uploadInfosQ);
    const autoMappingsQ = loadAutoMappings(tableInfosQ);

    return Q.all([uploadInfosQ, tableInfosQ, autoMappingsQ, localizationQ])
        .spread((uploadInfos, tableInfos, autoMappings, localization) => {

            const fieldInfosSortedForSimpleMatch = _(tableInfos).chain()
                      .sortBy(ti => ti.name === 'taxononly' ? schema.models.Taxon.tableId : ti.tableId)
                      .map(ti => ti.fields)
                      .flatten()
                      .value();

            return {
                tableInfos: tableInfos,
                autoMap: autoMapColumns.bind(null, autoMappings, fieldInfosSortedForSimpleMatch),
                isDisallowedTable: isDisallowedTable
            };
        });
}


var loadQ;

module.exports = {
    load() {
        return loadQ || (loadQ = load());
    }
};

