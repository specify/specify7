define([
    'jquery', 'underscore', 'backbone', 'schema', 'templates',
    'text!resources/specify_workbench_datamodel.xml!noinline'
], function($, _, Backbone, schema, templates, wbDataModelXML) {
    "use strict";

    var wbDataModel = $.parseXML(wbDataModelXML);
    var tables = _.map($('table', wbDataModel), function(table) {
        return schema.getModel(table.getAttribute('table'));
    }).filter(function(table) { return table != null; });

    var fieldsByTableId = _.object(_.map(tables, function(table) {
        return [table.tableId, getFieldsForTable(table)];
    }));

    function getFieldsForTable(table) {
        return _.map( $('table[tableid="' + table.tableId + '"] field', wbDataModel), function(field) {
            return _.object(_.map(field.attributes, function(attr) {
                return [attr.name, attr.value];
            }));
        });
    }

    var TablesTray = Backbone.View.extend({
        __name__: "WorkbenchTemplateEditorTablesTray",
        events: {
            'click li': 'selected'
        },
        render: function() {
            this.$el.append(tables.map(function(table) {
                return $('<li>')
                    .text(table.getLocalizedName())
                    .prepend($('<img>', {src: table.getIcon()}))[0];
            }));
            return this;
        },
        selected: function(event) {
            var i = this.$('li').index(event.currentTarget);
            this.trigger('selected', tables[i]);
        },
        setTable: function(table) {
            var i = tables.indexOf(table);
            $(this.$('li').removeClass('selected')[i]).addClass('selected');
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
        setTable: function(table) {
            this.table = table;
            this.fields = fieldsByTableId[table.tableId];
            this.$el.empty().append(this.fields.map(function(field) {
                return $('<li>').text(field.column)[0];
            }));
            return this;
        },
        setField: function(field) {
            var i = this.fields.indexOf(field);
            $(this.$('li').removeClass('selected')[i]).addClass('selected');
        },
        selected: function(event) {
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
                $('<img>', {src: table.getIcon()}),
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
            this.$('.selected').remove();
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

            return this;
        },
        tableSelected: function(table) {
            this.tablesTray.setTable(table);
            this.fieldsTray.setTable(table);
            this.mappingTray.clearSelection();
            this.$('button').button('disable');
        },
        fieldSelected: function(table, field) {
            this.$('.wb-editor-map').button('enable');
            this.fieldsTray.setField(field);
            this.mappingTray.clearSelection();
        },
        mappingSelected: function(table, field) {
            this.$('.wb-editor-map').button('disable');
            this.$('.wb-editor-unmap').button('enable');
            this.tablesTray.setTable(table);
            this.fieldsTray.setTable(table);
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
            this.mappingTray.removeSelection();
            this.$('.wb-editor-unmap').button('disable');
            this.$('.wb-editor-map').button('enable');
        },
        setupMoveBtns: function(canMove) {
            this.$('.wb-editor-moveup').button(canMove.up ? 'enable' : 'disable');
            this.$('.wb-editor-movedown').button(canMove.down ? 'enable' : 'disable');
        },
        moveFieldUp: function() { this.mappingTray.moveFieldUp(); },
        moveFieldDown: function() { this.mappingTray.moveFieldDown(); }
    });

});
