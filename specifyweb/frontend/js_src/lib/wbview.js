"use strict";
require ('../css/workbench.css');

const $        = require('jquery');
const _        = require('underscore');
const Backbone = require('./backbone.js');
const Q        = require('q');
const Handsontable = require('handsontable');
const Papa = require('papaparse');

const schema = require('./schema.js');
const app = require('./specifyapp.js');
const WBName = require('./wbname.js');
const navigation = require('./navigation.js');

const template = require('./templates/wbview.html');
const statusTemplate = require('./templates/wbuploadstatus.html');

const WBView = Backbone.View.extend({
    __name__: "WbForm",
    className: "wbs-form",
    matchWithValidate: false,
    multiMatchSetting: 'skip',
    events: {
        'click .wb-upload': 'upload',
        'click .wb-validate': 'validate',
        'click .wb-plan': 'openPlan',
        'click .wb-show-plan': 'showPlan',
        'click .wb-delete': 'delete',
        'click .wb-save': 'saveClicked',
        'click .wb-export': 'export',
        'click .wb-toggle-highlights': 'toggleHighlights',
        'click .wb-cell_navigation': 'navigateCells',
        'click .wb-search-button': 'searchCells',
        'click .wb-replace-button': 'replaceCells',
        'click .wb-show-toolbelt': 'toggleToolbelt',
    },
    initialize({wb, data, uploadStatus}) {
        this.wb = wb;
        this.data = data;
        this.uploadStatus = uploadStatus;
        this.highlightsOn = false;
        this.cellInfo = [];
        this.rowValidationRequests = {};
        this.search_query = null;
    },
    render() {
        const mappingsPromise = Q(this.wb.rget('workbenchtemplate.workbenchtemplatemappingitems'))
                  .then(mappings => _.sortBy(mappings.models, mapping => mapping.get('viewOrder')));

        const colHeaders = mappingsPromise.then(mappings => _.invoke(mappings, 'get', 'caption'));
        const columns = mappingsPromise.then(mappings => _.map(mappings, (m, i) => ({data: i+1})));

        this.$el.append(template());
        new WBName({wb: this.wb, el: this.$('.wb-name')}).render();

        Q.all([colHeaders, columns]).spread(this.setupHOT.bind(this)).done();

        if (this.uploadStatus) this.openUploadProgress();
        return this;
    },
    setupHOT(colHeaders, columns) {
        if (this.data.length < 1)
            this.data.push(Array(columns.length + 1).fill(null));

        //initialize Handsontable
        const onChanged = this.spreadSheetChanged.bind(this);

        this.hot = new Handsontable(this.$('.wb-spreadsheet')[0], {
            height: this.calcHeight(),
            data: this.data,
            cells: this.defineCell.bind(this, columns.length),
            colHeaders: colHeaders,
            columns: columns,
            minSpareRows: 0,
            comments: true,
            rowHeaders: true,
            manualColumnResize: true,
            outsideClickDeselects: false,
            columnSorting: true,
            sortIndicator: true,
            search: {
                searchResultClass: 'wb-search-match-cell',
            },
            contextMenu: ['row_above', 'row_below', 'remove_row', '---------', 'undo', 'redo'],
            stretchH: 'all',
            afterCreateRow: (index, amount) => { this.fixCreatedRows(index, amount); onChanged(); },
            afterRemoveRow: () => { if (this.hot.countRows() === 0) { this.hot.alter('insert_row', 0); } onChanged();},
            afterSelection: (r, c) => this.currentPos = [r,c],
            afterChange: (change, source) => source === 'loadData' || onChanged(change),
        });

        $(window).resize(this.resize.bind(this));

        this.getUploadResults();
    },
    getUploadResults() {
        Q(this.wb.rget('workbenchrows'))
            .then(rows =>
                  rows.fetch({limit: 0})
                  .then(() => rows.map(row => [row.id, row.get('biogeomancerresults')])))
            .done(results => this.parseUploadResults(results));
    },
    initCellInfo(row, col) {
        const cols = this.hot.countCols();
        if(typeof this.cellInfo[row*cols + col] === "undefined") {
            this.cellInfo[row*cols + col] = {isNew: false, issues: [], matchesSearch: false};
        }
    },
    parseUploadResults(uploadResults) {
        const cols = this.hot.countCols();
        const headerToCol = {};
        for (let i = 0; i < cols; i++) {
            headerToCol[this.hot.getColHeader(i)] = i;
        }

        this.cellInfo = [];
        uploadResults.forEach(([rowId, resultJSON], row) => {
            let result;

            try {
                result = JSON.parse(resultJSON);
            } catch (e) {
                return;
            }

            this.parseRowValidationResult(row, result);
        });

        this.updateCellInfos();
    },
    updateCellInfos() {
        const cellCounts = {
            new_cells: this.cellInfo.reduce((count, info) => count + (info.isNew ? 1 : 0), 0),
            invalid_cells: this.cellInfo.reduce((count, info) => count + (info.issues.length ? 1 : 0), 0),
            search_results: this.cellInfo.reduce((count, info) => count + (info.matchesSearch ? 1 : 0), 0),
        };

        //update navigation information
        Object.values(document.getElementsByClassName('wb-navigation_total')).forEach(navigation_total_element => {
            const navigation_type = navigation_total_element.parentElement.getAttribute('data-navigation_type');
            navigation_total_element.innerText = cellCounts[navigation_type];
        });

        this.hot.render();
    },
    parseRowValidationResult(row, result) {
        const cols = this.hot.countCols();
        const headerToCol = {};
        for (let i = 0; i < cols; i++) {
            headerToCol[this.hot.getColHeader(i)] = i;
        }

        for (let i = 0; i < cols; i++) {
            delete this.cellInfo[row*cols + i];
        }

        const add_error_message = (column_name, issue) => {
            const col = headerToCol[column_name];
            this.initCellInfo(row, col);
            const cellInfo = this.cellInfo[row*cols + col];

            const ucfirst_issue = issue[0].toUpperCase() + issue.slice(1);
            cellInfo.issues.push(ucfirst_issue);
        };

        if(result === null)
            return;

        result.tableIssues.forEach(table_issue => table_issue.columns.forEach(column_name => {
            add_error_message(column_name, table_issue.issue);
        }));

        result.cellIssues.forEach(cell_issue => {
            add_error_message(cell_issue.column, cell_issue.issue);
        });

        result.newRows.forEach(table => table.columns.forEach(column_name => {
            const col = headerToCol[column_name];
            this.initCellInfo(row, col);
            const cellInfo = this.cellInfo[row*cols + col];
            cellInfo.isNew = true;
        }));
    },
    defineCell(cols, row, col, prop) {
        let cell_data;
        try {
            cell_data = this.cellInfo[row*cols + col];
        } catch (e) {
        };

        return {
            comment: cell_data && {value: cell_data.issues.join('<br>')},
            renderer: function(instance, td, row, col, prop, value, cellProperties) {
                if(cell_data && cell_data.isNew)
                    td.classList.add('wb-no-match-cell');

                if(cell_data && cell_data.issues.length)
                    td.classList.add('wb-invalid-cell');

                Handsontable.renderers.TextRenderer.apply(null, arguments);
            }
        };
    },
    openPlan() {
        navigation.go(`/workbench-plan/${this.wb.id}/`);
    },
    showPlan() {
        this.wb.rget('workbenchtemplate').done(wbtemplate => {
            $('<div>').append($('<textarea cols="120" rows="50">').text(wbtemplate.get('remarks'))).dialog({
                title: "Upload plan",
                width: 'auto',
                modal: true,
                close() { $(this).remove(); },
                buttons: {
                    Save() {
                        wbtemplate.set('remarks', $('textarea', this).val());
                        wbtemplate.save();
                        $(this).dialog('close');
                    } ,
                    Close() { $(this).dialog('close'); }
                }
            });
        });
    },
    fixCreatedRows: function(index, amount) {
        // Handsontable doesn't insert the correct number of elements in newly
        // inserted rows. It inserts as many as there are columns, but there
        // should be an extra one at the begining representing the wb row id.
        for (let i = 0; i < amount; i++) {
            this.data[i + index] = Array(this.hot.countCols() + 1).fill(null);
        }
    },
    spreadSheetChanged(change) {
        this.$('.wb-upload, .wb-validate').prop('disabled', true);
        this.$('.wb-upload, .wb-match').prop('disabled', true);
        this.$('.wb-save').prop('disabled', false);
        navigation.addUnloadProtect(this, "The workbench has not been saved.");

        change && change.forEach(([row]) => {
            const rowData = this.hot.getDataAtRow(row);
            const data = Object.fromEntries(rowData.map((value, i) => [this.hot.getColHeader(i), value]));
            const req = this.rowValidationRequests[row] = $.post(`/api/workbench/validate_row/${this.wb.id}/`, data);
            req.done(result => this.gotRowValidationResult(row, req, result));
        });
    },
    gotRowValidationResult(row, req, result) {
        if (req === this.rowValidationRequests[row]) {
            this.parseRowValidationResult(row, result);
            this.updateCellInfos();
        }
    },
    resize: function() {
        this.hot && this.hot.updateSettings({height: this.calcHeight()});
        return true;
    },
    calcHeight: function() {
        return $(window).height() - this.$el.offset().top - 50;
    },
    saveClicked: function() {
        this.save().done();
    },
    save: function() {
        // clear validation
        this.cellInfo = [];
        this.hot.render();

        //show saving progress bar
        var dialog = $('<div><div class="progress-bar"></div></div>').dialog({
            title: 'Saving',
            modal: true,
            open: function(evt, ui) { $('.ui-dialog-titlebar-close', ui.dialog).hide(); },
            close: function() {$(this).remove();}
        });
        $('.progress-bar', dialog).progressbar({value: false});

        //send data
        return Q($.ajax('/api/workbench/rows/' + this.wb.id + '/', {
            data: JSON.stringify(this.data),
            error: this.checkDeletedFail.bind(this),
            type: "PUT"
        })).then(data => {
            this.data = data;
            this.hot.loadData(data);
            this.spreadSheetUpToDate();
        }).finally(() => dialog.dialog('close'));
    },
    checkDeletedFail(jqxhr) {
        if (jqxhr.status === 404) {
            this.$el.empty().append('Dataset was deleted by another session.');
            jqxhr.errorHandled = true;
        }
    },
    spreadSheetUpToDate: function() {
        this.$('.wb-upload, .wb-validate').prop('disabled', false);
        this.$('.wb-upload, .wb-match').prop('disabled', false);
        this.$('.wb-save').prop('disabled', true);
        navigation.removeUnloadProtect(this);
    },
    uploadClicked() {
        const emptyRows = this.data.map(
            row => _.all(row.slice(1), cell => cell == null || cell.trim() === "")
        ).reduce((rows, isEmpty, index) => isEmpty ? rows.concat(index) : rows, []);

        if (emptyRows.length > 0) {
            const removeRows = () => {
                emptyRows.reverse(); // remove rows from the end so the indices don't change.
                emptyRows.forEach(row => this.hot.alter('remove_row', row));
                this.save().done(() => this.upload());
            };

            $('<div>The dataset contains empty rows which should be removed before uploading.</div>')
                .dialog({
                    title: `Remove ${emptyRows.length} empty row${emptyRows.length > 1 ? 's' : ''}?`,
                    modal: true,
                    buttons: {
                        Remove() { $(this).dialog('close'); removeRows(); },
                        Cancel() { $(this).dialog('close'); }
                    }
                });
        } else {
            this.upload();
        }
    },
    upload: function() {
        const begin = () => {
            $.post(`/api/workbench/upload/${this.wb.id}/`).fail(jqxhr => {
                this.checkDeletedFail(jqxhr);
                // this.closeUploadProgress();
            });
            // this.openUploadProgress();
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
        const openPlan = () => this.openPlan();
        this.wb.rget('workbenchtemplate.remarks').done(plan => {
            if (plan == null || plan.trim() === "") {
                $('<div>No plan has been defined for this dataset. Create one now?</div>').dialog({
                    title: "No Plan is defined.",
                    modal: true,
                    buttons: {
                        'Create': openPlan,
                        'Cancel': function() { $(this).dialog('close'); }
                    }
                });
            } else {
                $.post(`/api/workbench/validate/${this.wb.id}/`).fail(jqxhr => {
                    this.checkDeletedFail(jqxhr);
                }).done(() => {
                    this.openUploadProgress();
                });
            }
        });
    },
    closeUploadProgress() {
        this.uploadProgressDialog.dialog('close');
    },
    openUploadProgress() {
        this.stopUploadProgressRefresh = false;
        const stopRefresh = () => this.stopUploadProgressRefresh = true;
        const refreshTime = 2000;

        const dialog = this.uploadProgressDialog = $(statusTemplate()).dialog({
            modal: true,
            open: function(evt, ui) { $('.ui-dialog-titlebar-close', ui.dialog).hide(); },
            close: function() { $(this).remove(); stopRefresh(); },
            buttons: [{text: 'Abort', click: () => { $.post(`/api/workbench/upload_abort/${this.wb.id}/`); }}]
        });
        $('.status td', dialog).text('...');

        const refresh = () => $.get(`/api/workbench/upload_status/${this.wb.id}/`).done(
            status => {
                if (this.stopUploadProgressRefresh) {
                    return;
                } else {
                    window.setTimeout(refresh, refreshTime);
                }

                if (status == null) {
                    stopRefresh();
                    $('.status td', dialog).text('finished');
                    dialog.dialog('option', 'buttons',
                                  [{text: 'Close', click: function() { $(this).dialog('close'); }}]);
                    this.getUploadResults();
                } else {
                    const [operation, state, meta] = status;
                    $('.operation td', dialog).text(operation);
                    $('.status td', dialog).text(state);
                    if (state === 'PROGRESS') {
                        $('.rows', dialog).show();
                        $('.rows td', dialog).text(`${meta.current} / ${this.hot.countRows()}`);
                    } else {
                        $('.rows', dialog).hide();
                    }
                }
            });

        window.setTimeout(refresh, refreshTime);
    },
    showHighlights: function() {
        this.highlightsOn = true;
        this.hot.render();
    },
    removeHighlights: function() {
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
    },
    delete: function(e) {
        let dialog;
        const doDelete = () => {
            dialog.dialog('close');
            dialog = $('<div><div class="progress-bar"></div></div>').dialog({
                modal: true,
                title: "Deleting",
                close: function() { $(this).remove(); },
                open: function(evt, ui) { $('.ui-dialog-titlebar-close', ui.dialog).hide(); }
            });
            $('.progress-bar', dialog).progressbar({value: false});
            this.wb.destroy().done(() => {
                this.$el.empty().append('<p>Dataset deleted.</p>');
                dialog.dialog('close');
            }).fail(jqxhr => {
                this.checkDeletedFail(jqxhr);
                dialog.dialog('close');
            });
        };

        dialog = $('<div>Really delete?</div>').dialog({
            modal: true,
            title: "Confirm delete",
            close: function() { $(this).remove(); },
            buttons: {
                'Delete': doDelete,
                'Cancel': function() { $(this).dialog('close'); }
            }
        });
    },
    export: function(e) {
        const data = Papa.unparse({
            fields: this.hot.getColHeader(),
            data: this.data.map(row => row.slice(1))
        });
        const wbname = this.wb.get('name');
        const filename = wbname.match(/\.csv$/) ? wbname : wbname + '.csv';
        const blob = new Blob([data], {type: 'text/csv;charset=utf-8;'});
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.setAttribute('download', filename);
        a.click();
    },
    navigateCells: function(e,match_current_cell=false){
        const button = e.target;
        const direction = button.getAttribute('data-navigation_direction');
        const button_parent = button.parentElement;
        const type = button_parent.getAttribute('data-navigation_type');

        const number_of_columns = this.hot.countCols();

        const selected_cell = this.hot.getSelectedLast();

        let current_position = 0;
        if(typeof selected_cell !== "undefined") {
            const [row, col] = selected_cell;
            current_position = row * number_of_columns + col;
        }

        const cellIsType = (info) => {
            switch(type) {
            case 'invalid_cells':
                return info.issues.length > 0;
            case 'new_cells':
                return info.isNew;
            case 'search_results':
                return info.matchesSearch;
            default:
                return false;
            }
        };

        let new_position = current_position;
        let found = false;
        for (;
             new_position >= 0 && new_position < this.cellInfo.length;
             new_position += direction === 'next' ? 1 : -1)
        {
            if (new_position === current_position && !match_current_cell) continue;

            const info = this.cellInfo[new_position];
            if (typeof info === "undefined") continue;
            found = cellIsType(info);
            if (found) break;
        }

        if (found) {
            const row = Math.floor(new_position / number_of_columns);
            const col = new_position - row * number_of_columns;
            this.hot.selectCell(row, col, row, col);

            const cell_relative_position = this.cellInfo.reduce((count, info, i) => count + (cellIsType(info) && i <= new_position ? 1 : 0), 0);
            const current_position_element = button_parent.getElementsByClassName('wb-navigation_position')[0];
            current_position_element.innerText = cell_relative_position;
        }
    },
    searchCells: function(e){
        const cols = this.hot.countCols();
        const button = e.target;
        const container = button.parentElement;
        const navigation_position_element = container.getElementsByClassName('wb-navigation_position')[0];
        const navigation_total_element = container.getElementsByClassName('wb-navigation_total')[0];
        const search_query_element = container.getElementsByClassName('wb-search_query')[0];
        const navigation_button = container.getElementsByClassName('wb-cell_navigation');
        const search_query = search_query_element.value;

        const searchPlugin = this.hot.getPlugin('search');
        const results = searchPlugin.query(search_query);
        this.search_query = search_query;

        this.cellInfo.forEach(cellInfo => {cellInfo.matchesSearch = false;});
        results.forEach(({row, col}) => {
            this.initCellInfo(row, col);
            this.cellInfo[row*cols + col].matchesSearch = true;
        });
        this.hot.render();

        navigation_total_element.innerText = results.length;
        navigation_position_element.innerText = 0;

        if(!this.navigateCells({target:navigation_button[0]},true))
            this.navigateCells({target:navigation_button[1]},true);

    },
    replaceCells: function(e){
        const cols = this.hot.countCols();
        const button = e.target;
        const container = button.parentElement;
        const replacement_value_element = container.getElementsByClassName('wb-replace_value')[0];
        const replacement_value = replacement_value_element.value;

        const cellUpdates = [];
        this.cellInfo.forEach((info, i) => {
            if (info.matchesSearch) {
                const row = Math.floor(i / cols);
                const col = i - row * cols;
                const cellValue = this.hot.getDataAtCell(row, col);
                cellUpdates.push([row, col, cellValue.split(this.search_query).join(replacement_value)]);
            }
        });

        this.hot.setDataAtCell(cellUpdates);
    },
    toggleToolbelt: function(e){
        const button = e.target;
        const container = button.closest('.wb-header');
        const toolbelt = container.getElementsByClassName('wb-toolbelt')[0];
        if(toolbelt.style.display === 'none')
            toolbelt.style.display = '';
        else
            toolbelt.style.display = 'none';
    }
});

module.exports = function loadWorkbench(id) {
    var dialog = $('<div><div class="progress-bar"></div></div>').dialog({
        title: 'Loading',
        modal: true,
        open: function(evt, ui) { $('.ui-dialog-titlebar-close', ui.dialog).hide(); },
        close: function() {$(this).remove();}
    });
    $('.progress-bar', dialog).progressbar({value: false});
    var wb = new schema.models.Workbench.Resource({id: id});
    Q(wb.fetch().fail(app.handleError)).then(
        () => Q.all([
            Q($.get(`/api/workbench/rows/${id}/`)),
            Q($.get(`/api/workbench/upload_status/${id}/`)),
        ])).spread(function(data, uploadStatus) {
            app.setTitle("WorkBench: " + wb.get('name'));
            app.setCurrentView(new WBView({
                wb: wb,
                data: data,
                uploadStatus: uploadStatus
            }));
        }).catch(jqxhr => jqxhr.errorHandled || (() => {throw jqxhr;})()).done();
};
