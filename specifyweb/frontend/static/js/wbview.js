define([
    'jquery', 'underscore', 'backbone', 'whenall',
    'require', 'icons', 'specifyapi', 'schema',
    'handsontable',
    'text!resources/specify_workbench_upload_def.xml!noinline',
    'jquery-ui'
], function($, _, Backbone, whenAll, require, icons, api, schema, Handsontable, wbupdef) {
    "use strict";

    var wbUploadDef = $.parseXML(wbupdef.toLowerCase());

    function getField(mapping) {
        var tableName = mapping.get('tablename').toLowerCase();
        var fieldName = mapping.get('fieldname').toLowerCase();
        var updef = $('field[table="' + tableName + '"][name="' + fieldName + '"]', wbUploadDef);
        if (updef.length == 1) {
            tableName = updef.attr('actualtable') || tableName;
            fieldName = updef.attr('actualname') || fieldName;
        }
        var model = schema.getModel(tableName);
        return model.getField(fieldName);
    }

    function getPickListItems(field) {
        var picklistName = field && field._localization.picklistname;
        return picklistName &&
            api.getPickListByName(picklistName).pipe(function(pl) {
                return (pl.get('type') == 0) && pl.rget('picklistitems').pipe(function(plItems) {
                    return plItems.fetch({ limit: 0 }).pipe(function() { return plItems.models; });
                });
            });
    }

    function makeHeaders(mappings) {
        return _.invoke(mappings, 'get', 'caption');
    }

    function makeColumns(picklists) {
        return _.map(picklists, function(picklist, i) {
            var col = {data: i + 1};
            picklist && _(col).extend({
                type: 'autocomplete',
                source: _.invoke(picklist, 'get', 'title')
            });
            return col;
        });
    }

    return Backbone.View.extend({
        __name__: "WbForm",
        className: "wbs-form",
        events: {
            'click .wb-save': 'save',
            'click .wb-load': 'load'
        },
        initialize: function(options) {
            this.wb = options.wb;
            this.data = options.data;
        },
        getMappings: function() {
            return this.wb.rget('workbenchtemplate.workbenchtemplatemappingitems').pipe(function(mappings) {
                return _.sortBy(mappings.models, function(model) { return model.get('viewOrder'); });
            });
        },
        render: function() {
            var mappings = this.getMappings();
            var fields = mappings.pipe(function(mappings) { return whenAll(_.map(mappings, getField)); });
            var picklists = fields.pipe(function(fields) { return whenAll(_.map(fields, getPickListItems)); });
            var colHeaders = mappings.pipe(makeHeaders);
            var columns = picklists.pipe(makeColumns);

            $('<h2>').text("Workbench: " + this.wb.get('name'))
                .appendTo(this.el)
                .append(
                    $('<button class="wb-save" disabled>Save</button>'),
                    $('<button class="wb-load" disabled>Reload</button>')
                );

            var spreadsheet = $('<div class="wb-spreadsheet">').appendTo(this.el);
            var enableButtons = function() { this.$('button').prop('disabled', false); }.bind(this);

            $.when(colHeaders, columns).done(function (colHeaders, columns) {
                this.hot = new Handsontable(spreadsheet[0], {
                    height: this.calcHeight(),
                    data: this.data,
                    colHeaders: colHeaders,
                    columns: columns,
                    minSpareRows: 1,
                    rowHeaders: true,
                    manualColumnResize: true,
                    columnSorting: true,
                    sortIndicator: true,
                    contextMenu: true,
                    stretchH: 'all',
                    afterCreateRow: enableButtons,
                    afterRemoveRow: enableButtons,
                    afterChange: function(change, source) { source === 'loadData' || enableButtons(); }
                });
                $(window).resize(this.resize.bind(this));
            }.bind(this));

            return this;
        },
        resize: function() {
            this.hot && this.hot.updateSettings({height: this.calcHeight()});
            return true;
        },
        calcHeight: function() {
            return $(window).height() - this.$el.offset().top - 50;
        },
        load: function() {
            var dialog = $('<div>Loading...</div>').dialog({
                title: 'Loading',
                modal: true,
                close: function() {$(this).remove();}
            });
            $.get('/api/workbench/rows/' + this.wb.id + '/').done(function(data) {
                this.data = data;
                this.hot.loadData(data);
                dialog.dialog('close');
                this.loaded();
            }.bind(this));
        },
        save: function() {
            var dialog = $('<div>Saving...</div>').dialog({
                title: 'Saving',
                modal: true,
                close: function() {$(this).remove();}
            });
            $.ajax('/api/workbench/rows/' + this.wb.id + '/', {
                data: JSON.stringify(this.hot.getData()),
                type: "PUT"
            }).done(function(data) {
                this.data = data;
                this.hot.loadData(data);
                dialog.dialog('close');
                this.loaded();
            }.bind(this));
        },
        loaded: function() {
            this.$('button').prop('disabled', true);
        }
    });
});
