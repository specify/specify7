"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');
var Q        = require('q');
var Handsontable = require('handsontable');
const moment = require('moment');
const humanizeDuration = require('humanize-duration');

var getPickListByName = require('./getpicklistbyname.js');
var schema            = require('./schema.js');
var app    = require('./specifyapp.js');

const template = require('./templates/wbview.html');
const statusTemplate = require('./templates/wbuploadstatus.html');
const detailsTemplate = require('./templates/wbuploaddetails.html');

function fromNow(time) {
    return humanizeDuration(moment().diff(time), { round: true, largest: 2 }) + ' ago';
}

var highlightRE = /^\[(\d+) \[\[(\d+ ?)*\]\]\] (.*)$/;
var errorRE = /^((e|E)rror:\s*(.*))|(-1,-1:\s*(.*))$/;

function atoi(str) { return parseInt(str, 10); }

function parseLog(log, nCols) {
    const lines = log.split('\n');
    const highlights = lines
              .map(line => highlightRE.exec(line))
              .filter(match => match != null)
              .map(match => ({
                  row: atoi(match[1]),
                  cols: match.slice(2, match.length - 1).map(atoi),
                  message: match[match.length - 1]
              }));

    const byPos = highlights.reduce(
        (rows, highlight) => highlight.cols.reduce(
            (rows, col) => ((rows[highlight.row * nCols + col] = highlight), rows)
            , rows)
        , []);

    const errors = lines
              .map(line => errorRE.exec(line))
              .filter(match => match != null)
              .map(match => match[3] || match[5]);

    return {highlights: highlights, byPos: byPos, errors: errors};
}


var WBView = Backbone.View.extend({
    __name__: "WbForm",
    className: "wbs-form",
    events: {
        'click .wb-upload': 'upload',
        'click .wb-validate': 'validate',
        'click .wb-save': 'save',
        'click .wb-next-error, .wb-prev-error': 'gotoError',
        'click .wb-toggle-highlights': 'toggleHighlights',
        'click .wb-upload-details': 'showUploadLog'
    },
    initialize: function({wb, data, uploadStatus}) {
        this.wb = wb;
        this.data = data;
        this.uploadStatus = uploadStatus;
        this.highlightsOn = false;
    },
    render: function() {
        const mappingsPromise = Q(this.wb.rget('workbenchtemplate.workbenchtemplatemappingitems'))
                  .then(mappings => _.sortBy(mappings.models, mapping => mapping.get('viewOrder')));

        const colHeaders = mappingsPromise.then(mappings => _.invoke(mappings, 'get', 'caption'));
        const columns = mappingsPromise.then(mappings => _.map(mappings, (m, i) => ({data: i+1})));

        this.$el.append(template({ dataSetName: this.wb.get('name') }));

        Q.all([colHeaders, columns]).spread(this.setupHOT.bind(this)).done();

        this.processUploadStatus();
        return this;
    },
    processUploadStatus: function() {
        if (!this.uploadStatus) return;

        if (this.uploadStatus.is_running) {
            this.openUploadProgress();
        } else {
            this.$('.wb-upload-info').text(
                (this.uploadStatus.no_commit ?
                 (this.uploadStatus.success ? 'Validation passed' : 'Validation failed')
                 :
                 (this.uploadStatus.success ? 'Uploaded' : 'Last upload encountered errors')) +
                ' (' + fromNow(this.uploadStatus.end_time) + ')'
            );
            this.loadUploadLog();
            this.$('.wb-upload-controls').show();
        }
    },
    loadUploadLog: function() {
        $.get('/api/workbench/upload_log/' + this.uploadStatus.log_name + '/').done(
            log => {
                this.uploadLog = log;
                this.infoFromLog = parseLog(log, this.hot.countCols());
                this.$('.wb-invalid-cell-count').text(this.infoFromLog.highlights.length);

                if (this.uploadStatus.success) {
                    this.removeHighlights();
                    this.$('.wb-invalid-cells').hide();
                } else {
                    this.showHighlights();
                    this.$('.wb-invalid-cells').show();
                }
            });
    },
    showUploadLog: function(event) {
        event.preventDefault();
         $(detailsTemplate({info: this.infoFromLog, log: this.uploadLog}))
            .dialog({
                modal: true,
                width: 'auto',
                close: function() { $(this).remove(); }
            });
    },
    setupHOT: function (colHeaders, columns) {
        if (this.data.length < 1) this.data.push(Array(columns.length + 1).fill(null));

        const onChanged = this.spreadSheetChanged.bind(this);
        const renderer = this.renderCell.bind(this);

        this.hot = new Handsontable(this.$('.wb-spreadsheet')[0], {
            height: this.calcHeight(),
            data: this.data,
            cells: () => ({renderer: renderer}),
            colHeaders: colHeaders,
            columns: columns,
            minSpareRows: 0,
            rowHeaders: true,
            manualColumnResize: true,
            columnSorting: true,
            sortIndicator: true,
            contextMenu: true,
            stretchH: 'all',
            afterCreateRow: (index, amount) => { this.fixCreatedRows(index, amount); onChanged(); },
            afterRemoveRow: onChanged,
            afterSelection: (r, c) => this.currentPos = [r,c],
            afterChange: (change, source) => source === 'loadData' || onChanged()
        });

        const makeTooltip = td => {
            const coords = this.hot.getCoords(td);
            const pos = this.hot.countCols() * coords.row + coords.col;
            const info = this.infoFromLog.byPos[pos];
            return $('<span>').text(info.message);
        };

        this.$('.wb-spreadsheet').tooltip({
            items: ".wb-invalid-cell",
            content: function() { return makeTooltip(this); }
        });

        $(window).resize(this.resize.bind(this));
    },
    fixCreatedRows: function(index, amount) {
        // Handsontable doesn't insert the correct number of elements in newly
        // inserted rows. It inserts as many as there are columns, but there
        // should be an extra one at the begining representing the wb row id.
        for (let i = 0; i < amount; i++) {
            this.data[i + index] = Array(this.hot.countCols() + 1).fill(null);
        }
    },
    renderCell: function(instance, td, row, col, prop, value, cellProperties) {
        Handsontable.renderers.TextRenderer.apply(null, arguments);
        if (!this.highlightsOn) return;
        const pos = instance.countCols() * row + col;
        const highlightInfo = this.infoFromLog.byPos[pos];
        const $td = $(td);
        if (highlightInfo) {
            $td.addClass('wb-invalid-cell');
        } else {
            $td.removeClass('wb-invalid-cell');
        }
    },
    spreadSheetChanged: function() {
        this.$('.wb-upload, .wb-validate').prop('disabled', true);
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
            data: JSON.stringify(this.data),
            type: "PUT"
        }).done(function(data) {
            this.data = data;
            this.hot.loadData(data);
            dialog.dialog('close');
            this.spreadSheetUpToDate();
        }.bind(this));
    },
    spreadSheetUpToDate: function() {
        this.$('.wb-upload, .wb-validate').prop('disabled', false);
        this.$('.wb-save').prop('disabled', true);
    },
    upload: function() {
        const begin = () => {
            $.post('/api/workbench/upload/' + this.wb.id + '/');
            this.openUploadProgress();
        };

        $('<div>Once the upload process begins, it cannot be aborted.</div>').dialog({
            title: "Proceed with upload?",
            modal: true,
            buttons: [
                {text: 'Proceed', click: function() { $(this).dialog('close'); begin(); }},
                {text: 'Cancel', click: function() { $(this).dialog('close'); }}
            ]
        });
    },
    validate: function() {
        $.post('/api/workbench/validate/' + this.wb.id + '/');
        this.openUploadProgress();
    },
    openUploadProgress: function() {
        let stopRefresh = false;
        const refreshTime = 2000;

        const dialog = $(statusTemplate()).dialog({
            modal: true,
            open: function(evt, ui) { $('.ui-dialog-titlebar-close', ui.dialog).hide(); },
            close: function() { $(this).remove(); stopRefresh = true; }
        });
        $('.status', dialog).text('...');

        const refresh = () => $.get('/api/workbench/upload_status/' + this.wb.id + '/').done(
            (status) => {
                const statusText = status.is_running ?
                          (status.no_commit ? 'Validating...' : 'Uploading...')
                      : status.success ?
                          (status.no_commit ? 'Validation passed.' : 'Upload succeeded.')
                      : (status.no_commit ? 'Validation failed.' : 'Upload failed.');

                if (stopRefresh) return;
                $('.status', dialog).text(statusText);
                $('.startTime', dialog).text(fromNow(status.start_time));
                $('.rows', dialog).text(
                    status.last_row == null ? 'None' :
                        ('' + (1 + status.last_row) + ' / ' + this.hot.countRows())
                );

                if (status.is_running) {
                    window.setTimeout(refresh, refreshTime);
                } else {
                    dialog.dialog('option', 'buttons',
                                  [{text: 'Close', click: function() { $(this).dialog('close'); }}]);
                    this.uploadStatus = status;
                    this.processUploadStatus();
                }
            });

        window.setTimeout(refresh, refreshTime);
    },
    showHighlights: function() {
        if (this.highlightsOn) return;
        this.highlightsOn = true;
        this.hot.render();
    },
    gotoError: function(evt) {
        const dir = $(evt.currentTarget).hasClass('wb-prev-error') ? -1 : 1;
        const nCols = this.hot.countCols();
        const currentPos = this.currentPos ? this.currentPos[0] * nCols + this.currentPos[1] : -1;
        const maxPos = nCols * this.hot.countRows();
        for(let i = currentPos + dir; i >= 0 && i < maxPos; i += dir) {
            if (this.infoFromLog.byPos[i] != null) {
                this.currentPos = [Math.floor(i / nCols), i % nCols];
                break;
            }
        }
        this.currentPos && this.hot.selectCell(this.currentPos[0], this.currentPos[1]);
    },
    removeHighlights: function() {
        if (!this.highlightsOn) return;
        this.highlightsOn = false;
        this.hot.render();
    },
    toggleHighlights: function() {
        if (this.highlightsOn) {
            this.removeHighlights();
            this.$('.wb-toggle-highlights').text('Show');
        } else {
            this.showHighlights();
            this.$('.wb-toggle-highlights').text('Hide');
        }
    }
});

module.exports = function loadWorkbench(id) {
    var dialog = $('<div><div class="progress-bar"></div></div>').dialog({
        title: 'Loading',
        modal: true,
        close: function() {$(this).remove();}
    });
    $('.progress-bar', dialog).progressbar({value: false});
    var wb = new schema.models.Workbench.Resource({id: id});
    Q.all([
        Q(wb.fetch()),
        Q($.get('/api/workbench/rows/' + id + '/')),
        Q($.get('/api/workbench/upload_status/' + id + '/'))
    ]).spread(function(__, data, uploadStatus) {
        app.setTitle("Workbench: " + wb.get('name'));
        app.setCurrentView(new WBView({
            wb: wb,
            data: data,
            uploadStatus: uploadStatus
        }));
    }).catch(app.handleError);
};
