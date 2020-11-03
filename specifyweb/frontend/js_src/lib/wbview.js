"use strict";
require ('../css/workbench.css');

const $        = require('jquery');
const _        = require('underscore');
const Backbone = require('./backbone.js');
const Q        = require('q');
const Handsontable = require('handsontable');
const moment = require('moment');
const humanizeDuration = require('humanize-duration');
const Papa = require('papaparse');

var getPickListByName = require('./getpicklistbyname.js');
var schema            = require('./schema.js');
var app    = require('./specifyapp.js');
const WBName = require('./wbname.js');
var navigation = require('./navigation.js');

const template = require('./templates/wbview.html');
const statusTemplate = require('./templates/wbuploadstatus.html');
const detailsTemplate = require('./templates/wbuploaddetails.html');
const settingsTemplate = require('./templates/wbsettings.html');

function fromNow(time) {
    return humanizeDuration(moment().diff(time), { round: true, largest: 2 }) + ' ago';
}

const highlightRE = /^(mi|)\[(\d+) \[(\d+ ?)*\]\] (.*)$/;
const errorRE = /^((e|E)rror:\s*(.*))|(-1,-1:\s*(.*))$/;
const duplicateEntryRE = /ERROR .* - (Duplicate entry .*)$/;

function atoi(str) { return parseInt(str, 10); }

function parseLog(log, nCols) {
    const lines = log.split('\n');

    
   const highlights = lines
              .map(line => highlightRE.exec(line))
              .filter(match => match != null)
              .map(match => ({
                  row: atoi(match[2]),
                  cols: match.slice(3, match.length - 1).map(atoi),
                  message: match[match.length - 1],
                  highlight: match[1] == 'mi'
                      ? (match[match.length - 1].indexOf('A new') != -1 ? 'no-match' : 'multi-match') : 'invalid'
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

    const duplicateEntry = lines
              .map(line => duplicateEntryRE.exec(line))
              .filter(match => match != null)
              .map(match => match[1])[0];

    const rows = lines
              .map(line => /uploading row (\d+)/.exec(line))
              .filter(match => match != null)
              .map(match => parseInt(match[1], 10));

    return {
        highlights: highlights,
        byPos: byPos,
        errors: errors,
        duplicateEntry: duplicateEntry,
        lastRow: rows[rows.length - 1]
    };
}


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
        'click .wb-next-error, .wb-prev-error': 'gotoError',
        'click .wb-toggle-highlights': 'toggleHighlights',
        'click .wb-upload-details': 'showUploadLog',
        'click .wb-setting': 'showSettingsDlg',
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
        this.column_indexes = [];
        this.cells_to_highlight = {};
    },
    render() {
        const mappingsPromise = Q(this.wb.rget('workbenchtemplate.workbenchtemplatemappingitems'))
                  .then(mappings => _.sortBy(mappings.models, mapping => mapping.get('viewOrder')));

        const colHeaders = mappingsPromise.then(mappings => ["upload result"].concat(_.invoke(mappings, 'get', 'caption')));
        const columns = mappingsPromise.then(mappings => _.map(mappings, (m, i) => ({data: i+2})));

        this.$el.append(template());
        new WBName({wb: this.wb, el: this.$('.wb-name')}).render();

        Q.all([colHeaders, columns]).spread(this.setupHOT.bind(this)).done();

        if (this.uploadStatus) this.openUploadProgress();
        return this;
    },
    setupHOT (colHeaders, columns) {

        if (this.data.length < 1)
            this.data.push(Array(columns.length + 1).fill(null));

        columns = columns.map(columns=>{
            columns.validator = this.validateCell;
            return columns;
        });

        let column_indexes = colHeaders;
        column_indexes.shift();  // remove validation results column

        this.column_indexes = column_indexes;

        //parse validation results

        const inverted_column_indexes = Object.entries(column_indexes).reduce((inverted_column_indexes,[column_index, column_name])=>{
            inverted_column_indexes[column_name] = parseInt(column_index);
            return inverted_column_indexes;
        },{});

        this.validation_results_object = Object.entries(this.data).reduce((validation_results,[row_key,row_data])=>{

            row_key = parseInt(row_key);

            let validation_results_raw = null;
            try {
                validation_results_raw = JSON.parse(row_data[1]);
            } catch (exception) {
                if(!(exception instanceof SyntaxError))//only catch JSON parse errors
                    throw exception;
                console.error('Failed to parse validation message (' + (typeof row_data[1]) + '): '+ row_data[1]);
            }

            if(validation_results_raw===null)
                return validation_results;

            if(typeof validation_results[row_key] === "undefined")
                validation_results[row_key] = {};

            function add_error_message(column_name, issue){

                const column_index = inverted_column_indexes[column_name];

                if(typeof validation_results[row_key] === "undefined")
                    validation_results[row_key] = [];

                if(typeof validation_results[row_key][column_index] === "undefined")
                    validation_results[row_key][column_index] = [];

                const ucfirst_issue = issue[0].toUpperCase() + issue.slice(1);
                validation_results[row_key][column_index].push(ucfirst_issue);
            }

            for(const table_issue of validation_results_raw['tableIssues'])
                for(const column_name of table_issue['columns'])
                    add_error_message(column_name,table_issue['issue']);

            for(const cell_issue of validation_results_raw['cellIssues'])
                add_error_message(cell_issue['column'],cell_issue['issue']);

            for(const table_issue of validation_results_raw['newRows'])
                for(const column_name of table_issue['columns'])
                    if(typeof validation_results[row_key][column_name] === "undefined")
                        validation_results[row_key][column_name] = true;

            return validation_results;

        },[]);

        //attach error messages to cells
        this.validation_results_array = [];
        let navigation_cells_count = {
            'new_cells': 0,
            'invalid_cells': 0,
        };
        for(const [row_key,row_data] of Object.entries(this.validation_results_object))
            for(const [cell_key,cell_data] of Object.entries(row_data)) {

                const data = {
                    'row': row_key,
                    'col': cell_key,
                    'cell_type': (typeof cell_data === "object") ? 'invalid_cells' : 'new_cells',
                }

                if (data['cell_type']==='invalid_cells')
                    data['comment'] = {value: cell_data.join('<br>')}

                navigation_cells_count[data['cell_type']]++;

                this.validation_results_array.push(data);

            }
        this.validation_results_sorted = {
            'invalid_cells': this.validation_results_array.filter(validation_result=>validation_result['cell_type']==='invalid_cells'),
            'new_cells': this.validation_results_array.filter(validation_result=>validation_result['cell_type']==='new_cells')
        };


        //update navigation information
        for(const navigation_total_element of Object.values(document.getElementsByClassName('wb-navigation_total'))){
            const navigation_type = navigation_total_element.parentElement.getAttribute('data-navigation_type');
            if(typeof navigation_cells_count[navigation_type] !== "undefined")
                navigation_total_element.innerText = navigation_cells_count[navigation_type];
        }


        //initialize Handsontable
        const onChanged = this.spreadSheetChanged.bind(this);
        const renderer = this.renderCell.bind(this);

        this.hot = new Handsontable(this.$('.wb-spreadsheet')[0], {
            height: this.calcHeight(),
            data: this.data,
            cells: () => ({renderer: renderer}),
            cell: this.validation_results_array,
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
            afterChange: (change, source) => source === 'loadData' || onChanged(),
        });

        $(window).resize(this.resize.bind(this));
    },

    renderCell(instance, td, row, col, prop, value, cellProperties) {

        if(typeof this.validation_results_object[row] !== "undefined" && typeof this.validation_results_object[row][col] !== "undefined"){

            const column_validation_result = this.validation_results_object[row][col];

            if(typeof column_validation_result === "boolean")
                td.classList.add('wb-no-match-cell');

            else if(typeof column_validation_result === "object")
                td.classList.add('wb-invalid-cell');

        }

        Handsontable.renderers.TextRenderer.apply(null, arguments);
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
    processUploadStatus: function() {
        if (!this.uploadStatus) return;

        if (this.uploadStatus.is_running) {
            this.openUploadProgress();
        } else {
            this.$('.wb-upload-info').text(
                (this.uploadStatus.no_commit ?
                 (this.uploadStatus.success ? 'Validation passed' : 'Validation failed')
                 :
                 (this.uploadStatus.success ? 'Uploaded' + (
                     this.uploadStatus.skipped_rows < 1 ? ''
                         : this.uploadStatus.skipped_rows < 2 ? ' (1 row skipped)'
                         : ` (${this.uploadStatus.skipped_rows} rows skipped)`
                 ) : 'Last upload encountered errors')) +
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

                this.$('.wb-invalid-cells')[this.infoFromLog.highlights.length > 0 ? 'show' : 'hide']();
                (this.infoFromLog.highlights.length > 0 || this.infoFromLog.duplicateEntry) ?
                    this.showHighlights() : this.removeHighlights();
            });
    },
    showUploadLog: function(event) {
        event.preventDefault();
        $(detailsTemplate({
            info: this.infoFromLog,
            log: this.uploadLog,
            status: this.uploadStatus
        })).dialog({
            modal: true,
            width: 'auto',
            close: function() { $(this).remove(); }
        });
    },
    showSettingsDlg: function(event) {
        event.preventDefault();
        var thisthis = this;
        $(settingsTemplate({
            match: this.matchWithValidate,
            multi: this.multiMatchSetting
        })).dialog({
            modal: true,
            width: 'auto',
            close: function() {
                thisthis.matchWithValidate = $('.wb-match-chkbox')[0].checked;
                thisthis.multiMatchSetting = $('.wb-upload-multiple-match-set')[0].value;
                $(this).remove();
            }
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
    spreadSheetChanged: function() {
        this.$('.wb-upload, .wb-validate').prop('disabled', true);
        this.$('.wb-upload, .wb-match').prop('disabled', true);
        this.$('.wb-save').prop('disabled', false);
        navigation.addUnloadProtect(this, "The workbench has not been saved.");
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

        //show saving progress bar
        var dialog = $('<div><div class="progress-bar"></div></div>').dialog({
            title: 'Saving',
            modal: true,
            open: function(evt, ui) { $('.ui-dialog-titlebar-close', ui.dialog).hide(); },
            close: function() {$(this).remove();}
        });
        $('.progress-bar', dialog).progressbar({value: false});

        //automatically trim all strings
        let data = Object.entries(this.data).reduce((rows,[row_key,row_data])=>{

            rows[row_key] = row_data.map(cell_value=> {
                if(typeof cell_value === "string")
                    return cell_value.trim();
                else
                    return cell_value;
            });

            return rows;
        },{});

        //send data
        return Q($.ajax('/api/workbench/rows/' + this.wb.id + '/', {
            data: JSON.stringify(data),
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
    checkUploaderLock(title, next) {
        const query = new schema.models.SpTaskSemaphore.LazyCollection({
            filters: { taskname: "WORKBENCHUPLOAD", islocked: "True" }
        });
        query.fetch().done(() => {
            if (query.length > 0) {
                query.at(0).rget('owner', true).done(user => {
                    const dialog = $(
                        `<div>The ${title.toLowerCase()} is currently in use by <span></span>.</div>`
                    );
                    $('span', dialog).text(user.get('name'));
                    dialog.dialog({
                        title: `${title} busy.`,
                        modal: true,
                        buttons: [{text: 'Close', click() { $(this).dialog('close'); }}]
                    });
                });
            } else next();
        });

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
    validateWithMatch: function() {
        this.checkUploaderLock('Validator', () => {
            $.post('/api/workbench/match/' + this.wb.id + '/').fail(jqxhr => {
                this.checkDeletedFail(jqxhr);
                this.closeUploadProgress();
            });
            this.openUploadProgress();
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
                    dialog.dialog('option', 'buttons',
                                  [{text: 'Close', click: function() { $(this).dialog('close'); }}]);
                } else {
                    const [state, meta] = status;


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

        const selected_cell = this.hot.getSelectedLast();
        let current_row = 0;
        let current_col = 0;

        if(typeof selected_cell !== "undefined")
            [current_row, current_col] = selected_cell;

        const number_of_columns = this.hot.countCols();
        const get_cell_position = (row,col) => parseInt(row)*number_of_columns + parseInt(col);

        const cells_to_search = {};
        for(const cell of this.validation_results_sorted[type])
            cells_to_search[get_cell_position(cell['row'],cell['col'])] = cell;

        let cell_keys = Object.keys(cells_to_search).sort((a,b) => a-b);
        let cell_keys_length = cell_keys.length;

        if(cell_keys_length===0)
            return;

        let current_position = get_cell_position(current_row,current_col);

        let target_cell=-1;
        let cell_relative_position=0;

        let comparison_function;

        if(direction==='next')
            comparison_function = (position, current_position) => position > current_position;
        else {
            cell_keys = cell_keys.reverse();
            comparison_function = (position, current_position) => position < current_position;
        }

        for(const position of cell_keys.map(key=>parseInt(key))) {
            if (
                (match_current_cell && position===current_position) ||
                comparison_function(position,current_position)
            ) {
                target_cell = position;
                break;
            }
            cell_relative_position++;
        }

        // following cell was found. Horay! 🎉🎉🎉
        if(target_cell !== -1){
            const coordinates = ['row','col','row','col'].map(key=>parseInt(cells_to_search[target_cell][key]));
            this.hot.selectCell(...coordinates);

            if(direction!=='next')
                cell_relative_position = cell_keys_length - cell_relative_position;
            else
                cell_relative_position++;

            const current_position_element = button_parent.getElementsByClassName('wb-navigation_position')[0];
            current_position_element.innerText = cell_relative_position;

            return true;
        }
        else  // better luck next time 😓
            return false;

    },
    searchCells: function(e){

        const button = e.target;
        const container = button.parentElement;
        const navigation_position_element = container.getElementsByClassName('wb-navigation_position')[0];
        const navigation_total_element = container.getElementsByClassName('wb-navigation_total')[0];
        const search_query_element = container.getElementsByClassName('wb-search_query')[0];
        const navigation_button = container.getElementsByClassName('wb-cell_navigation');
        const search_query = search_query_element.value;

        const searchPlugin = this.hot.getPlugin('search');
        this.validation_results_sorted['search_results'] = {
            search_query: search_query,
            results: searchPlugin.query(search_query)
        };
        this.hot.render();

        navigation_total_element.innerText = this.validation_results_sorted['search_results']['results'].length;
        navigation_position_element.innerText = 0;

        if(!this.navigateCells({target:navigation_button[0]},true))
            this.navigateCells({target:navigation_button[1]},true);

    },
    replaceCells: function(e){

        const button = e.target;
        const container = button.parentElement;
        const replacement_value_element = container.getElementsByClassName('wb-replace_value')[0];
        const replacement_value = replacement_value_element.value;

        this.hot.setDataAtCell(this.validation_results_sorted['search_results']['results'].map(cell=>
            [
                cell['row'],
                cell['col'],
                cell['data'].replaceAll(
                    this.validation_results_sorted['search_results']['search_query'],
                    replacement_value
                )
            ]
        ));

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
