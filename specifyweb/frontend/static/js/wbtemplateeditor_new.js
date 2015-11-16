define([
    'require', 'jquery', 'underscore', 'backbone', 'schema', 'templates',
    'text!resources/specify_workbench_datamodel.xml!noinline'
], function(require, $, _, Backbone, schema, templates, wbDataModelXML) {
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

    var TablesTray = Backbone.View.extend({
        __name__: "WorkbenchTemplateEditorTablesTray",
        events: {
            'click li': 'selected'
        },
        render: function() {
            this.$el.append(tableInfos.map(function(table) {
                return $('<li>', {'data-tablename': table.name})
                    .text(table.title)
                    .prepend($('<img>', {src: table.specifyModel.getIcon()}))[0];
            }));
            return this;
        },
        selected: function(event) {
            if ($(event.currentTarget).is('.disabled-table')) return;
            var i = this.$('li').index(event.currentTarget);
            this.trigger('selected', tableInfos[i]);
        },
        setTable: function(tableInfo, mappings) {
            this.$('li').removeClass('selected');
            if (tableInfo != null) {
                var i = tableInfos.indexOf(tableInfo);
                this.$('li').slice(i, i+1).addClass('selected');
            }
            //if (mappings.length > 0) this.updateDisabledTables(tableInfo);
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
            return tableInfos[i];
        }
    });

    var FieldsTray = Backbone.View.extend({
        __name__: "WorkbenchTemplateEditorFieldsTray",
        events: {
            'click li': 'selected'
        },
        setTable: function(tableInfo, mappings) {
            if (tableInfo == null) return this;
            var alreadyMapped = _.map(mappings, function(map) { return map.field; });
            this.tableInfo = tableInfo;
            this.fields = tableInfo.fields;
            this.$el.empty().append(this.fields.map(function(field) {
                var li = $('<li>').text(field.column);
                _(alreadyMapped).contains(field) && li.addClass('already-mapped');
                return li[0];
            }));
            return this;
        },
        setField: function(fieldInfo) {
            this.$('li').removeClass('selected');
            if (fieldInfo != null) {
                var i = this.fields.indexOf(fieldInfo);
                this.$('li').slice(i, i+1).addClass('selected');
            }
        },
        selected: function(event) {
            if ($(event.currentTarget).is('.already-mapped')) return;
            var i = this.$('li')
                    .removeClass('selected')
                    .index(event.currentTarget);
            this.trigger('selected', this.fields[i]);
        },
        getSelected: function() {
            var i = this.$('li.selected').index();
            return this.fields[i];
        }
    });

    var MappingItemModel = Backbone.Model.extend({
        // fieldInfo
        // dataset column
        getFieldInfo: function() {
            return this.get('fieldInfo');
        },
        getTableInfo: function() {
            var fieldInfo = this.getFieldInfo();
            return fieldInfo && fieldInfo.tableInfo;
        }
    });

    var MappingItemView = Backbone.View.extend({
        __name__: "MappingItemView",
        tagName: 'li',
        events: {
            'click': 'selected'
        },
        initialize: function() {
            this.model.on('change', this.render, this);
        },
        render: function() {
            this.$el.empty();
            var fieldInfo = this.model.get('fieldInfo');
            var img = fieldInfo ? fieldInfo.tableInfo.specifyModel.getIcon() : null;
            var specifyColumn = fieldInfo ? fieldInfo.column : "Discard";
            this.$el.append(
                $('<img>', {src: img}),
                $('<span>').text(specifyColumn),
                $('<span>').text(this.model.get('column'))
            );
            return this;
        },
        selected: function(event) {
            this.trigger('selected', this, this.model);
        },
        mapField: function(fieldInfo) {
            this.model.set('fieldInfo', fieldInfo);
        }
    });


    var MappingTray = Backbone.View.extend({
        __name__: "MappingTray",
        initialize: function(options) {
            this.mappingItems = options.columns.map(function(column) {
                return new MappingItemModel({column: column});
            });
            // this.collection.on('add remove', this.render, this);
            this.selectedView = null;
        },
        render: function() {
            var mappingItemViews = this.mappingItems.map(function(itemModel) {
                return new MappingItemView({model: itemModel});
            });

            mappingItemViews.forEach(function(view) {
                view.render().on('selected', this.selected, this);
            }, this);

            this.$el.append(_.pluck(mappingItemViews, 'el'));
            return this;
        },
        selected: function(mappingView, mapping) {
            this.clearSelection();
            mappingView.$el.addClass('selected');
            this.selectedView = mappingView;
            this.trigger('selected', mapping);
            //this.checkCanMove();
        },
        clearSelection: function() {
            this.selected = null;
            this.$('li').removeClass('selected');
        },
        getSelected: function() {
            return this.selectedView;
        },
        mapField: function(fieldInfo) {
            this.getSelected().mapField(fieldInfo);
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

            this.mappingTray = new MappingTray({
                el: $('.wb-editor-mappings', editor),
                columns: this.columns})
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
        tableSelected: function(tableInfo) {
            var mappings = this.mappingTray.mappingItems;
            this.tablesTray.setTable(tableInfo, mappings);
            this.fieldsTray.setTable(tableInfo, mappings);
            this.$('button').button('disable');
        },
        fieldSelected: function(fieldInfo) {
            if (this.mappingTray.getSelected() != null) {
                this.$('.wb-editor-map').button('enable');
            }
            this.fieldsTray.setField(fieldInfo);
        },
        mappingSelected: function(mapping) {
            var mappings = this.mappingTray.mappingItems;
            this.$('.wb-editor-map').button('disable');
            this.$('.wb-editor-unmap').button('enable');
            this.tablesTray.setTable(mapping.getTableInfo(), mappings);
            this.fieldsTray.setTable(mapping.getTableInfo(), mappings);
            this.fieldsTray.setField(mapping.getFieldInfo());
        },
        mapField: function() {
            this.$('button').button('disable');
            this.mappingTray.mapField(this.fieldsTray.getSelected());
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


    // var MappingTray = Backbone.View.extend({
    //     __name__: "MappingTray",
    //     events: {
    //         'click li': 'selected'
    //     },
    //     initialize: function(options) {
    //         this.collection = new Backbone.Collection(
    //             options.columns.map(function(column, i ) {
    //                 return new MappingItemModel({column: column, viewOrder: i});
    //             }));
    //         this.collection.on('add remove change', this.render, this);
    //         this.selectedMapping = null;
    //     },
    //     render: function() {
    //         var items = this.collection.map(function(mapping) {
    //             var fieldInfo = mapping.getFieldInfo();
    //             var img = fieldInfo ? fieldInfo.tableInfo.specifyModel.getIcon() : null;
    //             var specifyColumn = fieldInfo ? fieldInfo.column : "Discard";
    //             return $('<li>').data('mapping', mapping).append(
    //                 $('<img>', {src: img}),
    //                 $('<span>').text(specifyColumn),
    //                 $('<span>').text(mapping.get('column'))
    //             )[0];
    //         });
    //         this.$el.empty().append(items);
    //         return this;
    //     },
    //     selected: function(event) {
    //         this.clearSelection();
    //         var selected = $(event.currentTarget);
    //         selected.addClass('selected');
    //         this.selectedMapping = selected.data('mapping');
    //         this.trigger('selected', this.selectedMapping);
    //         // this.checkCanMove();
    //     },
    //     clearSelection: function() {
    //         this.selected = null;
    //         this.$('li').removeClass('selected');
    //     },
    //     getSelected: function() {
    //         return this.selectedMapping;
    //     },
    //     mapField: function(fieldInfo) {
    //         this.selectedMapping.set('fieldInfo', fieldInfo);
    //     }
    // });
