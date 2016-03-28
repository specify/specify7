"use strict";
require('../css/workbenchtemplateeditor.css');

var $         = require('jquery');
var _         = require('underscore');
var Backbone  = require('./backbone.js');
var Bacon     = require('baconjs');
var Immutable = require('immutable');


var schema     = require('./schema.js');
var wbschema   = require('./wbschema.js');
var userInfo   = require('./userinfo.js');

var wbtemplateeditor = require('./templates/wbtemplateeditor.html');

function SelectedTable($tables, selectedMapping) {
    return $tables
        .asEventStream('click', 'li')
        .filter(event => !$(event.currentTarget).is('.disabled-table'))
        .map(event => $(event.currentTarget).data('tableInfo'))
        .merge(
            selectedMapping.changes()
                .map(mapping => mapping && mapping.get('fieldInfo') && mapping.get('fieldInfo').tableInfo)
                .filter(tableInfo => tableInfo != null)
        )
        .toProperty(null);
}

function makeTableLIs(wbSchema, selectedTable, mappedTables) {
    return wbSchema.tableInfos.map(
        tableInfo => $('<li>')
            .text(tableInfo.title)
            .prepend($('<img>', {src: tableInfo.specifyModel.getIcon()}))
            .data('tableInfo', tableInfo)
            .addClass(wbSchema.isDisallowedTable(mappedTables, tableInfo.name) ? 'disabled-table' : '')
            .addClass(selectedTable === tableInfo ? 'selected' : '')[0]);
}

function TablesTray($tables, wbSchema, selectedTable, mappedTables) {
    var lis = Bacon.combineWith(
        selectedTable, mappedTables,
        makeTableLIs.bind(null, wbSchema)
    );
    lis.onValue(lis => $tables.empty().append(lis));
}

function SelectedField($fields, selectedTable, selectedMapping) {
    var selectedInd = $fields
            .asEventStream('click', 'li')
            .filter(event => !$(event.currentTarget).is('.already-mapped'))
            .map(event => $('li', $fields).index(event.currentTarget));

    return selectedTable
        .sampledBy(selectedInd, (tableInfo, i) => tableInfo.fields[i])
        .merge(
            selectedMapping.changes()
                .map(mapping => mapping && mapping.get('fieldInfo'))
                .filter(fieldInfo => fieldInfo != null)
        )
        .merge(selectedTable.changes().map(null))
        .toProperty(null);
}

function makeFieldLI(tableInfo, selectedFieldInfo, alreadyMappedFields) {
    var fieldInfos = tableInfo ? tableInfo.fields : [];
    return fieldInfos.map(
        fieldInfo => $('<li>')
            .text(fieldInfo.title)
            .addClass(alreadyMappedFields.includes(fieldInfo) ? 'already-mapped' : '')
            .addClass(selectedFieldInfo === fieldInfo ? 'selected' : '')[0]
    );
}

function FieldsTray($fields, selectedField, selectedTable, alreadyMapped) {
    var lis = Bacon.combineWith(selectedTable, selectedField, alreadyMapped, makeFieldLI);
    lis.onValue(lis => $fields.empty().append(lis));
}

function SelectedMapping($colMappings) {
    return $colMappings.asEventStream('click', 'li')
        .map(event => $(event.currentTarget).data('colMapping'))
        .toProperty(null);
}

function makeMappingLI(selectedMapping, colMapping) {
    var fieldInfo = colMapping.get('fieldInfo');
    var isSelected = selectedMapping && colMapping.get('origIndex') === selectedMapping.get('origIndex');
    var imgSrc = fieldInfo && fieldInfo.tableInfo.specifyModel.getIcon();
    return $('<li>')
        .data('colMapping', colMapping)
        .addClass(isSelected ? 'selected' : '')
        .append(
            $('<span>')
                .text(fieldInfo ? fieldInfo.title : 'Discard')
                .prepend(imgSrc ? $('<img>', {src: imgSrc}) : ''),
            $('<span class="spacer">'),
            $('<span>').text(colMapping.get('column')))[0];
}

function MappingsTray($colMappings, colMappings, selectedMapping) {
    var colMappingLIs = Bacon.combineWith(
        colMappings, selectedMapping,
        (colMappings, selectedMapping) =>
            colMappings
            .sortBy(mapping => mapping.get('curIndex'))
            .map(mapping => makeMappingLI(selectedMapping, mapping)));

    colMappingLIs.onValue(lis => $colMappings.empty().append(lis.toArray()));
}

function ColumnMappings(initMapping, columnsGiven, selectedMapping, selectedField, doMap, doUnMap, moveUp, moveDown) {
    return Bacon.update(
        initMapping,

        [selectedMapping, selectedField, doMap], (prev, mapping, fieldInfo) => {
            if (columnsGiven) {
                return prev.setIn([mapping.get('origIndex'), 'fieldInfo'], fieldInfo);
            } else {
                return prev.push(Immutable.Map(
                    {column: fieldInfo.title, fieldInfo: fieldInfo, origIndex: prev.count(), curIndex: prev.count()}));
            }
        },

        [selectedMapping, doUnMap], (prev, mapping) => {
            if (columnsGiven) {
                return prev.setIn([mapping.get('origIndex'), 'fieldInfo'], null);
            } else {
                return prev
                    .remove(mapping.get('origIndex'))
                    .map((m, i) => m.set('origIndex', i).set('curIndex', i));
            }
        },

        [selectedMapping, moveUp], (prev, selected) => {
            var current = prev.get(selected.get('origIndex'));
            var above = prev.find(m => m.get('curIndex') === current.get('curIndex') - 1);
            return prev
                .updateIn([selected.get('origIndex'), 'curIndex'], i => i - 1)
                .updateIn([above.get('origIndex'), 'curIndex'], i => i + 1);
        },

        [selectedMapping, moveDown], (prev, selected) => {
            var current = prev.get(selected.get('origIndex'));
            var below = prev.find(m => m.get('curIndex') === current.get('curIndex') + 1);
            return prev
                .updateIn([current.get('origIndex'), 'curIndex'], i => i + 1)
                .updateIn([below.get('origIndex'), 'curIndex'], i => i - 1);
        }
    );
}

function SimpleButton($el, icon) {
    $el.button({
        text: false,
        disabled: true,
        icons: { primary: icon}
    });

    return {
        clicks: $el.asEventStream('click'),
        enable: canMap => $el.button(canMap ? 'enable' : 'disable')
    };
}

function makeTemplate(mappings) {
    return new schema.models.WorkbenchTemplate.Resource({
        specifyuser: userInfo.resource_uri,
        workbenchtemplatemappingitems: makeMappingItems(mappings)
    });
}

function makeMappingItems(mappings) {
    return mappings
        .filter(m => m.get('fieldInfo') != null)
        .sortBy(m => m.get('curIndex'))
        .map((m, vieworder) => {
            var fieldInfo = m.get('fieldInfo');
            return new schema.models.WorkbenchTemplateMappingItem.Resource({
                caption: m.get('column'),
                xcoord: -1,
                ycoord: -1,
                carryforward: false,
                datafieldlength: fieldInfo.length ? parseInt(fieldInfo.length, 10) : 32767,
                fieldname: fieldInfo.name,
                srctableid: fieldInfo.tableInfo.tableId,
                tablename: fieldInfo.tableInfo.name,
                vieworder: vieworder,
                origimportcolumnindex: m.get('origIndex')
            });
        }).toArray();
}

module.exports =  Backbone.View.extend({
    __name__: "WorkbenchTemplateEditor",
    className: 'workbench-template-editor',
    initialize: function({columns}) {
        this.columnsIn = columns;
    },
    render: function() {
        wbschema.load().done(this._render.bind(this));
        return this;
    },
    _render: function(wbSchema) {
        const autoMappedCols = wbSchema.autoMap(this.columnsIn);
        const columnsWereGiven = autoMappedCols.count() > 0;

        var editor = $(wbtemplateeditor());
        this.$el.empty().append(editor);

        var mapButton = SimpleButton(this.$('.wb-editor-map'), 'ui-icon-arrowthick-1-e');
        var unMapButton = SimpleButton(this.$('.wb-editor-unmap'), 'ui-icon-arrowthick-1-w');
        var moveUpButton = SimpleButton(this.$('.wb-editor-moveup'), 'ui-icon-arrowthick-1-n');
        var moveDownButton = SimpleButton(this.$('.wb-editor-movedown'), 'ui-icon-arrowthick-1-s');

        var doneButton = new Bacon.Bus();

        var triggerClosed = this.trigger.bind(this, 'closed');

        this.$el.dialog({
            title: 'Workbench Template Mappings',
            width: 'auto',
            modal: true,
            close: function() {
                $(this).remove();
                triggerClosed();
            },
            buttons: [
                {text: 'Done', click: event => doneButton.push(event) },
                {text: 'Cancel', click: function() { $(this).dialog('close'); }}
            ]
        });


        var selectedMapping = SelectedMapping(this.$('.wb-editor-mappings'));
        var selectedTable = SelectedTable(this.$('.wb-editor-tables'), selectedMapping);
        var selectedField = SelectedField(this.$('.wb-editor-fields'), selectedTable, selectedMapping);

        var columnMappings = ColumnMappings(autoMappedCols, columnsWereGiven,
                                            selectedMapping, selectedField,
                                            mapButton.clicks, unMapButton.clicks,
                                            moveUpButton.clicks, moveDownButton.clicks);

        columnMappings.sampledBy(doneButton).onValue(
            mappings => this.trigger('created', makeTemplate(mappings)));

        var mappedTables = columnMappings.map(
            colMappings => colMappings
                .map(mapping => mapping.get('fieldInfo') && mapping.get('fieldInfo').tableInfo.name)
                .filter(tableName => tableName != null)
        );

        var mappedFields = columnMappings.map(
            colMappings => colMappings
                .map(mapping => mapping.get('fieldInfo'))
                .filter(fieldInfo => fieldInfo != null)
        );

        var mappedColumns = columnMappings.map(
            colMappings => colMappings
                .filter(mapping => mapping.get('fieldInfo') != null)
                .map(mapping => mapping.get('column'))
        );

        TablesTray(this.$('.wb-editor-tables'), wbSchema, selectedTable, mappedTables);
        FieldsTray(this.$('.wb-editor-fields'), selectedField, selectedTable, mappedFields);
        MappingsTray(this.$('.wb-editor-mappings'), columnMappings, selectedMapping);

        var canMap = Bacon.combineWith(
            selectedField, selectedMapping, mappedFields,
            (field, mapping, alreadyMapped) =>
                field != null &&
                (mapping != null || !this.columnsWereGiven) &&
                !alreadyMapped.includes(field));

        canMap.onValue(mapButton.enable);

        var canUnMap = Bacon.combineWith(
            selectedMapping, mappedColumns,
            (mapping, currentlyMapped) =>  mapping != null && currentlyMapped.includes(mapping.get('column')));

        canUnMap.onValue(unMapButton.enable);

        var canMoveUp = Bacon.combineWith(
            selectedMapping, columnMappings,
            (mapping, mappings) => mapping != null
                && mappings.getIn([mapping.get('origIndex'), 'curIndex']) > 0);

        canMoveUp.onValue(moveUpButton.enable);

        var canMoveDown = Bacon.combineWith(
            selectedMapping, columnMappings,
            (mapping, mappings) => mapping != null
                && mappings.getIn([mapping.get('origIndex'), 'curIndex']) < mappings.count() - 1);

        canMoveDown.onValue(moveDownButton.enable);
    }
});

