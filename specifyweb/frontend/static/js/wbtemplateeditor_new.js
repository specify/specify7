define([
    'require', 'jquery', 'underscore', 'backbone', 'bacon',
    'schema', 'templates',
    'text!resources/specify_workbench_datamodel.xml!noinline'
], function(require, $, _, Backbone, Bacon, schema, templates, wbDataModelXML) {
    "use strict";

    var wbDataModel = $.parseXML(wbDataModelXML);

    var tableInfos = _.map($('table', wbDataModel), function(tableNode) {
        tableNode = $(tableNode);
        var tableInfo = {
            tableId: parseInt(tableNode.attr('tableid'), 10),
            name: tableNode.attr('table')
        };

        tableInfo.specifyModel = tableInfo.name === 'taxononly' ?
            schema.models.Taxon :
            schema.getModelById(tableInfo.tableId);

        tableInfo.title = tableInfo.name === 'taxononly' ?
            'Taxon Import Only' :
            tableInfo.specifyModel.getLocalizedName();

        tableInfo.fields = getFieldsForTable(tableNode, tableInfo);
        return tableInfo;
    });

    function getFieldsForTable(tableNode, tableInfo) {
        return _.map(tableNode.find('field'), function(fieldDef) {
            var $fieldDef = $(fieldDef);
            return {
                tableInfo: tableInfo,
                column: $fieldDef.attr('column'), // Default caption
                name: $fieldDef.attr('name'),     // Specify field name
                type: $fieldDef.attr('type'),     // Specify field type
                length: $fieldDef.attr('length')
            };
        });
    }

    function SelectedTable($tables, selectedMapping) {
        return $tables
            .asEventStream('click', 'li')
            .filter(event => !$(event.currentTarget).is('.disabled-table'))
            .map(event => {
                var i = $('li', $tables).index(event.currentTarget);
                return tableInfos[i];
            })
            .merge(
                selectedMapping.changes()
                    .map(mapping => mapping && mapping.fieldInfo && mapping.fieldInfo.tableInfo)
                    .filter(tableInfo => tableInfo != null)
            )
            .toProperty(null);
    }

    function isDisabledTable(mappedTables, tableName) {
        if (_(mappedTables).contains('agent')) {
            return tableName !== 'agent';
        } else if (_(mappedTables).contains('taxononly')) {
            return tableName !== 'taxononly';
        } else if (mappedTables.length > 0) {
            return _(['agent', 'taxononly']).contains(tableName);
        } else {
            return false;
        }
    }

    function makeTableLIs(selectedTable, colMappings) {
        var mappedTables = colMappings
                .map(mapping => mapping.fieldInfo && mapping.fieldInfo.tableInfo.name)
                .filter(tableName => tableName != null);

        return tableInfos.map(
            tableInfo => $('<li>')
                .text(tableInfo.title)
                .prepend($('<img>', {src: tableInfo.specifyModel.getIcon()}))
                .addClass(isDisabledTable(mappedTables, tableInfo.name) ? 'disabled-table' : '')
                .addClass(selectedTable === tableInfo ? 'selected' : '')[0]);
    }

    function TablesTray($tables, selectedTable, colMappings) {
        var lis = Bacon.combineWith(selectedTable, colMappings, makeTableLIs);
        lis.onValue(lis => $tables.empty().append(lis));
    }

    function SelectedField($fields, selectedTable, selectedMapping) {
        return selectedTable
            .sampledBy($fields.asEventStream('click', 'li'), (tableInfo, event) => {
                var i = $('li', $fields).index(event.currentTarget);
                return tableInfo.fields[i];
            })
            .merge(
                selectedMapping.changes()
                    .map(mapping => mapping && mapping.fieldInfo)
                    .filter(fieldInfo => fieldInfo != null)
            )
            .merge(selectedTable.changes().map(null))
            .toProperty(null);
    }

    function makeFieldLI(tableInfo, selectedFieldInfo, alreadyMappedFields) {
        var fieldInfos = tableInfo ? tableInfo.fields : [];
        return fieldInfos.map(
            fieldInfo => $('<li>')
                .text(fieldInfo.column)
                .addClass(_(alreadyMappedFields).contains(fieldInfo) ? 'already-mapped' : '')
                .addClass(selectedFieldInfo === fieldInfo ? 'selected' : '')[0]
        );
    }

    function FieldsTray($fields, selectedField, selectedTable, colMappings) {
        var alreadyMapped = colMappings.map(
            colMappings => colMappings
                .map(mapping => mapping.fieldInfo)
                .filter(fieldInfo => fieldInfo != null)
        );

        var lis = Bacon.combineWith(selectedTable, selectedField, alreadyMapped, makeFieldLI);
        lis.onValue(lis => $fields.empty().append(lis));
    }

    function SelectedMapping($colMappings) {
        return $colMappings.asEventStream('click', 'li')
            .map(event => $(event.currentTarget).data('colMapping'))
            .toProperty(null);
    }

    function makeMappingLI(selectedMapping, colMapping) {
        var fieldInfo = colMapping.fieldInfo;
        var imgSrc = fieldInfo && fieldInfo.tableInfo.specifyModel.getIcon();
        return $('<li>')
            .data('colMapping', colMapping)
            .addClass(colMapping === selectedMapping ? 'selected' : '')
            .append(
                $('<img>', {src: imgSrc}),
                $('<span>').text(fieldInfo ? fieldInfo.column : 'Discard'),
                $('<span>').text(colMapping.column))[0];
    }

    function MappingsTray($colMappings, colMappings, selectedMapping) {
        var colMappingLIs = Bacon.combineWith(
            colMappings, selectedMapping,
            (colMappings, selectedMapping) =>
                colMappings.map(mapping => makeMappingLI(selectedMapping, mapping)));

        colMappingLIs.onValue(lis => $colMappings.empty().append(lis));
        colMappingLIs.onValue(() => {
            _.defer(() => _.each($('li', $colMappings), li => {
                // Force both spans to have the same width so that the
                // arrow is in the middle.
                var widths = _.map($('span', li), span => $(span).width());
                $('span', li).width(Math.max.apply(null, widths));
            }));
        });
    }

    function ColumnMappings(initCols, selectedMapping, selectedField, doMap, doUnMap) {
        return Bacon.update(
            initCols.map(colname => ({column: colname, fieldInfo: null})),

            [selectedMapping, selectedField, doMap], (prev, mapping, fieldInfo) => {
                mapping.fieldInfo = fieldInfo;
                return prev;
            },

            [selectedMapping, doUnMap], (prev, mapping) => {
                mapping.fieldInfo = null;
                return prev;
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

    return Backbone.View.extend({
        __name__: "WorkbenchTemplateEditor",
        className: 'workbench-template-editor',
        initialize: function(options) {
            this.columns = options.columns;
        },
        render: function() {
            var editor = $(templates.wbtemplateeditor());
            this.$el.empty().append(editor);

            var mapButton = SimpleButton(this.$('.wb-editor-map'), 'ui-icon-arrowthick-1-e');
            var unMapButton = SimpleButton(this.$('.wb-editor-unmap'), 'ui-icon-arrowthick-1-w');
            var moveUpButton = SimpleButton(this.$('.wb-editor-moveup'), 'ui-icon-arrowthick-1-n');
            var moveDownButton = SimpleButton(this.$('.wb-editor-movedown'), 'ui-icon-arrowthick-1-s');

            this.$el.dialog({
                title: 'Workbench Template Mappings',
                width: 'auto',
                modal: true,
                close: function() { $(this).remove(); },
                buttons: [
                    {text: 'Done', click: function() { this.trigger('created', this.makeTemplate()); }.bind(this) },
                    {text: 'Cancel', click: function() { $(this).dialog('close'); }}
                ]
            });

            var selectedMapping = SelectedMapping(this.$('.wb-editor-mappings'));
            var selectedTable = SelectedTable(this.$('.wb-editor-tables'), selectedMapping);
            var selectedField = SelectedField(this.$('.wb-editor-fields'), selectedTable, selectedMapping);

            var columnMappings = ColumnMappings(this.columns, selectedMapping, selectedField, mapButton.clicks, unMapButton.clicks);

            TablesTray(this.$('.wb-editor-tables'), selectedTable, columnMappings);
            FieldsTray(this.$('.wb-editor-fields'), selectedField, selectedTable, columnMappings);
            MappingsTray(this.$('.wb-editor-mappings'), columnMappings, selectedMapping);

            var canMap = Bacon.combineWith(
                selectedField, selectedMapping,
                (fieldInfo, colMapping) =>
                    colMapping && colMapping.fieldInfo !== fieldInfo);

            canMap.onValue(mapButton.enable);

            var canUnMap = selectedMapping.map(
                colMapping => colMapping && colMapping.fieldInfo != null);

            canUnMap.onValue(unMapButton.enable);

            return this;
        }
    });
});
