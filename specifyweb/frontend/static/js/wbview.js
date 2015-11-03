define([
    'jquery', 'underscore', 'backbone', 'q',
    'specifyapi', 'schema', 'handsontable', 'wbupload',
    'text!resources/specify_workbench_upload_def.xml!noinline'
], function($, _, Backbone, Q, api, schema, Handsontable, WBUpload, wbupdef) {
    "use strict";

    var wbUploadDef = $.parseXML(wbupdef.toLowerCase());

    var highlightRE = /^\[(\d+) \[\[(\d+ ?)*\]\]\] (.*)$/;
    function atoi(str) { return parseInt(str, 10); }

    function parseLog(log) {
        return log.split('\n')
            .map(function(line) { return highlightRE.exec(line); })
            .filter(function(match) { return match != null; })
            .reduce(function(rows, match) {
                rows[ atoi(match[1]) ] = {
                    cols: match.slice(2, match.length - 1).map(atoi),
                    message: match[match.length - 1]
                };
                return rows;
            }, []);
    }

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
            'click .wb-upload': 'upload',
            'click .wb-save': 'save'
        },
        initialize: function(options) {
            this.wb = options.wb;
            this.data = options.data;
        },
        getMappings: function() {
            return Q(this.wb.rget('workbenchtemplate.workbenchtemplatemappingitems'))
                .then(function(mappings) {
                    return _.sortBy(mappings.models, function(mapping) { return mapping.get('viewOrder'); });
                });
        },
        render: function() {
            var mappings = this.getMappings();
            var fields = mappings.then(function(mappings) { return Q.all(_.map(mappings, getField)); });
            var picklists = fields.then(function(fields) { return Q.all(_.map(fields, getPickListItems)); });
            var colHeaders = mappings.then(makeHeaders);
            var columns = picklists.then(makeColumns);

            $('<h2>').text("Workbench: " + this.wb.get('name'))
                .appendTo(this.el)
                .append(
                    $('<button class="wb-upload">Upload</button>'),
                    $('<button class="wb-save" disabled>Save</button>')
                );

            $('<div class="wb-spreadsheet">').appendTo(this.el);

            Q.all([colHeaders, columns]).spread(this.setupHOT.bind(this)).done();

            return this;
        },
        setupHOT: function (colHeaders, columns) {
            var onChanged = this.spreadSheetChanged.bind(this);
            var renderer = this.renderCell.bind(this);
            this.hot = new Handsontable(this.$('.wb-spreadsheet')[0], {
                height: this.calcHeight(),
                data: this.data,
                cells: function() { return {renderer: renderer}; },
                colHeaders: colHeaders,
                columns: columns,
                minSpareRows: 1,
                rowHeaders: true,
                manualColumnResize: true,
                columnSorting: true,
                sortIndicator: true,
                contextMenu: true,
                stretchH: 'all',
                afterCreateRow: onChanged,
                afterRemoveRow: onChanged,
                afterChange: function(change, source) { source === 'loadData' || onChanged(); }
            });
            $(window).resize(this.resize.bind(this));
        },
        renderCell: function(instance, td, row, col, prop, value, cellProperties) {
            Handsontable.renderers.TextRenderer.apply(null, arguments);
            var highlightInfo = this.highlights && this.highlights[row];
            if (highlightInfo && _.contains(highlightInfo.cols, col)) {
                td.style.background = '#FEE';
                td.title = highlightInfo.message;
            }
        },
        spreadSheetChanged: function() {
            this.$('.wb-upload').prop('disabled', true);
            this.$('.wb-save').prop('disabled', false);
        },
        resize: function() {
            this.hot && this.hot.updateSettings({height: this.calcHeight()});
            return true;
        },
        calcHeight: function() {
            return $(window).height() - this.$el.offset().top - 50;
        },
        save: function() {
            var dialog = $('<div><div class="progress-bar"></div></div>').dialog({
                title: 'Saving',
                modal: true,
                close: function() {$(this).remove();}
            });
            $('.progress-bar', dialog).progressbar({value: false});
            $.ajax('/api/workbench/rows/' + this.wb.id + '/', {
                data: JSON.stringify(this.hot.getData()),
                type: "PUT"
            }).done(function(data) {
                this.data = data;
                this.hot.loadData(data);
                dialog.dialog('close');
                this.spreadSheetUpToDate();
            }.bind(this));
        },
        spreadSheetUpToDate: function() {
            this.$('.wb-upload').prop('disabled', false);
            this.$('.wb-save').prop('disabled', true);
        },
        upload: function() {
            new WBUpload({wb: this.wb}).render().on('highlight', this.highlight, this);
        },
        highlight: function(logName) {
            $.get('/api/workbench/upload_log/' + logName + '/').done(function(log) {
                this.highlights = parseLog(log);
                this.hot.render();
            }.bind(this));
        }
    });
});
