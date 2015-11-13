define([
    'require', 'jquery', 'underscore', 'backbone', 'schema', 'templates',
    'text!resources/specify_workbench_datamodel.xml!noinline'
], function(require, $, _, Backbone, schema, templates, wbDataModelXML) {
    "use strict";

    var wbDataModel = $.parseXML(wbDataModelXML);

    function getAttrs(node) {
        return _.object(_.map(node.attributes, function(attr) {
            return [attr.name, attr.value];
        }));
    }

    var tables = _.map($('table', wbDataModel), function(tableNode) {
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

        return tableInfo;
    });

    function getFieldsForTable(table) {
        var fields = $('table[tableid="' + table.tableId + '"] field', wbDataModel);
        return _.map(fields , getAttrs);
    }

    var fieldsByTableId = _.object(_.map(tables, function(table) {
        return [table.tableId, getFieldsForTable(table)];
    }));


    var TablesTray = Backbone.View.extend({
        __name__: "WorkbenchTemplateEditorTablesTray",
        events: {
            'click li': 'selected'
        },
        render: function() {
            this.$el.append(tables.map(function(table) {
                return $('<li>', {'data-tablename': table.name})
                    .text(table.title)
                    .prepend($('<img>', {src: table.specifyModel.getIcon()}))[0];
            }));
            return this;
        },
        selected: function(event) {
            if ($(event.currentTarget).is('.disabled-table')) return;
            var i = this.$('li').index(event.currentTarget);
            this.trigger('selected', tables[i]);
        },
        setTable: function(table, mappings) {
            var i = tables.indexOf(table);
            $(this.$('li').removeClass('selected disabled-table')[i]).addClass('selected');
            if (mappings.length > 0) this.updateDisabledTables(table);
        },
        updateDisabledTables: function(table) {
            if (table.name === 'agent') {
                this.$('li[data-tablename!="agent"]').addClass('disabled-table');
            } else if (table.name === 'taxononly') {
                this.$('li[data-tablename!="taxononly"]').addClass('disabled-table');
            } else {
                this.$('li[data-tablename="agent"], li[data-tablename="taxononly"]').addClass('disabled-table');
            }
        },
        getSelected: function() {
            var i = this.$('li.selected').index();
            return tables[i];
        }
    });

    var FieldsTray = Backbone.View.extend({
        __name__: "WorkbenchTemplateEditorFieldsTray",
        events: {
            'click li': 'selected'
        },
        setTable: function(table, mappings) {
            var alreadyMapped = _.map(mappings, function(map) { return map.field; });
            this.table = table;
            this.fields = fieldsByTableId[table.tableId];
            this.$el.empty().append(this.fields.map(function(field) {
                var li = $('<li>').text(field.column);
                _(alreadyMapped).contains(field) && li.addClass('already-mapped');
                return li[0];
            }));
            return this;
        },
        setField: function(field) {
            var i = this.fields.indexOf(field);
            $(this.$('li').removeClass('selected')[i]).addClass('selected');
        },
        selected: function(event) {
            if ($(event.currentTarget).is('.already-mapped')) return;
            var i = this.$('li')
                    .removeClass('selected')
                    .index(event.currentTarget);
            this.trigger('selected', this.table, this.fields[i]);
        },
        getSelected: function() {
            var i = this.$('li.selected').index();
            return this.fields[i];
        }
    });

    var MappingTray = Backbone.View.extend({
        __name__: "WorkbenchTemplateEditorMappingTray",
        events: {
            'click li': 'selected'
        },
        addField: function(table, field) {
            $('<li class="selected">').append(
                $('<img>', {src: table.specifyModel.getIcon()}),
                $('<span>').text(field.column),
                $('<span>').text(field.column)
            ).appendTo(this.el).data({
                table: table,
                field: field
            });
            this.trigger('selected', table, field);
            this.checkCanMove();
        },
        clearSelection: function() {
            this.$('li').removeClass('selected');
        },
        removeSelection: function() {
            var selected = this.$('.selected');
            var mapping = selected.data();
            selected.remove();
            return mapping;
        },
        selected: function(event) {
            this.clearSelection();
            var selected = $(event.currentTarget);
            selected.addClass('selected');
            this.trigger('selected', selected.data('table'), selected.data('field'));
            this.checkCanMove();
        },
        moveFieldUp: function() {
            var selected = this.$('li.selected');
            selected.insertBefore(selected.prev());
            this.checkCanMove();
        },
        moveFieldDown: function() {
            var selected = this.$('li.selected');
            selected.insertAfter(selected.next());
            this.checkCanMove();
        },
        checkCanMove: function() {
            var lis = this.$('li');
            var i = lis.index(this.$('li.selected'));
            this.trigger('canmove', {up: i > 0, down: i < lis.length - 1});
        },
        getMappings: function() {
            return  _.map(this.$('li'), function(li) { return $(li).data(); });
        },
        makeMappingItems: function() {
            var fieldAndTables = this.getMappings();
            return _.map(fieldAndTables, function(ft, i) {
                return new schema.models.WorkbenchTemplateMappingItem.Resource({
                    caption: ft.field.column,
                    datafieldlength: ft.field.length && parseInt(ft.field.length, 10),
                    fieldname: ft.field.name,
                    tableid: ft.table.tableId,
                    tablename: ft.table.name,
                    vieworder: i
                });
            });
        }
    });

    return Backbone.View.extend({
        __name__: "WorkbenchTemplateEditor",
        className: 'workbench-template-editor',
        events: {
            'click .wb-editor-map': 'mapField',
            'click .wb-editor-unmap': 'unMapField',
            'click .wb-editor-moveup': 'moveFieldUp',
            'click .wb-editor-movedown': 'moveFieldDown'
        },
        initialize: function(options) {
            this.columns = options.columns;
        },
        render: function() {
            var editor = $(templates.wbtemplateeditor());
            this.tablesTray = new TablesTray({el: $('.wb-editor-tables', editor)})
                .render()
                .on('selected', this.tableSelected, this);

            this.fieldsTray = new FieldsTray({el: $('.wb-editor-fields', editor)})
                .render()
                .on('selected', this.fieldSelected, this);

            this.mappingTray = new MappingTray({el: $('.wb-editor-mappings', editor)})
                .render()
                .on('selected', this.mappingSelected, this)
                .on('canmove', this.setupMoveBtns, this);

            this.$el.empty().append(editor);

            this.$('.wb-editor-map').button({
                text: false,
                disabled: true,
                icons: { primary: 'ui-icon-arrowthick-1-e'}
            });

            this.$('.wb-editor-unmap').button({
                text: false,
                disabled: true,
                icons: { primary: 'ui-icon-arrowthick-1-w'}
            });

            this.$('.wb-editor-moveup').button({
                text: false,
                disabled: true,
                icons: { primary: 'ui-icon-arrowthick-1-n'}
            });

            this.$('.wb-editor-movedown').button({
                text: false,
                disabled: true,
                icons: { primary: 'ui-icon-arrowthick-1-s'}
            });

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

            return this;
        },
        tableSelected: function(table) {
            var mappings = this.mappingTray.getMappings();
            this.tablesTray.setTable(table, mappings);
            this.fieldsTray.setTable(table, mappings);
            this.mappingTray.clearSelection();
            this.$('button').button('disable');
        },
        fieldSelected: function(table, field) {
            this.$('.wb-editor-map').button('enable');
            this.fieldsTray.setField(field);
            this.mappingTray.clearSelection();
        },
        mappingSelected: function(table, field) {
            var mappings = this.mappingTray.getMappings();
            this.$('.wb-editor-map').button('disable');
            this.$('.wb-editor-unmap').button('enable');
            this.tablesTray.setTable(table, mappings);
            this.fieldsTray.setTable(table, mappings);
            this.fieldsTray.setField(field);
        },
        mapField: function() {
            this.$('button').button('disable');
            this.mappingTray.addField(
                this.tablesTray.getSelected(),
                this.fieldsTray.getSelected()
            );
        },
        unMapField: function() {
            var removed = this.mappingTray.removeSelection();
            var mappings = this.mappingTray.getMappings();
            this.$('.wb-editor-unmap').button('disable');
            this.$('.wb-editor-map').button('enable');
            this.tablesTray.setTable(removed.table, mappings);
            this.fieldsTray.setTable(removed.table, mappings);
            this.fieldsTray.setField(removed.field);
        },
        setupMoveBtns: function(canMove) {
            this.$('.wb-editor-moveup').button(canMove.up ? 'enable' : 'disable');
            this.$('.wb-editor-movedown').button(canMove.down ? 'enable' : 'disable');
        },
        moveFieldUp: function() { this.mappingTray.moveFieldUp(); },
        moveFieldDown: function() { this.mappingTray.moveFieldDown(); },
        makeTemplate: function() {
            var app = require('specifyapp');
            return new schema.models.WorkbenchTemplate.Resource({
                specifyuser: app.user.resource_uri,
                workbenchtemplatemappingitems: this.mappingTray.makeMappingItems()
            });
        }
    });

});
