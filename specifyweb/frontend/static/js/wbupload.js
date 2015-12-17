"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');
var Q        = require('./vendor/q-1.4.1.js');
var moment   = require('moment');

    function showTime(timeStr) {
        return timeStr ? moment(timeStr).fromNow() : '...';
    }

module.exports = Backbone.View.extend({
        __name__: "WBUploadView",
        initialize: function(options) {
            this.wb = options.wb;
        },
        render: function() {
            var refreshTimer = setInterval(this.refreshList.bind(this), 5000);
            $('<table style="width: 600px" class="wb-logs">').append(
                '<thead><tr><th></th><th>Started</th><th>Finshed</th><th>Rows Processed</th><th>Success</th></tr></thead>',
                '<tbody>'
            ).appendTo(this.el);
            this.$el.dialog({
                title: "Upload Logs for " + this.wb.get('name'),
                modal: true,
                width: 'auto',
                height: 600,
                close: function() {$(this).remove(); clearInterval(refreshTimer); },
                buttons: [
                    {text: "Start Upload", click: this.startUpload.bind(this)},
                    {text: "Highlight Cells", click: this.highlight.bind(this)},
                    {text: "Save Log", click: this.saveLog.bind(this)},
                    {text: "Delete Log", click: this.deleteLog.bind(this)},
                    {text: "Close", click: function() { $(this).dialog('close'); }}
                ]
            });
            this.refreshList();
            return this;
        },
        refreshList: function() {
            $.get('/api/workbench/upload_status_list/' + this.wb.id + '/').done(this.gotStatusList.bind(this));
        },
        gotStatusList: function(statusList) {
            this.statusList = _(statusList).sortBy(function(status) { return status.start_time || 'end of list';  });
            var rows = _(this.statusList).map(function(status) {
                return $('<tr>').append(
                    $('<td><input type="radio" name="select"></td>'),
                    $('<td>').text(showTime(status.start_time)),
                    $('<td>').text(showTime(status.end_time)),
                    $('<td>').text(status.last_row || '...'),
                    $('<td>').text(status.end_time == null ? '...' : status.success ? "Succeeded" : "Failed"))[0];
            });
            this.$('tbody').empty().append(rows);
            this.$(':radio:last').prop('checked', true);
        },
        startUpload: function() {
            var begin = function() {
                $.post('/api/workbench/upload/' + this.wb.id + '/').done(this.refreshList.bind(this));
            }.bind(this);

            $('<div>Once the upload process begins, it cannot be aborted.</div>').dialog({
                title: "Proceed with upload?",
                modal: true,
                buttons: [
                    {text: 'Proceed', click: function() { $(this).dialog('close'); begin(); }},
                    {text: 'Cancel', click: function() { $(this).dialog('close'); }}
                ]
            });
        },
        getSelected: function() {
            var i = this.$(':radio').index(this.$(':radio:checked'));
            return this.statusList[i].log_name;
        },
        highlight: function() {
            var logName = this.getSelected();
            this.trigger('highlight', logName);
            this.$el.dialog('close');
        },
        saveLog: function() {
            var logName = this.getSelected();
            window.open('/api/workbench/upload_log/' + logName + '/');
        },
        deleteLog: function() {
            var logName = this.getSelected();
            var doDelete = function() {
                $.ajax({
                    url: '/api/workbench/upload_log/' + logName + '/',
                    type: 'DELETE'
                }).done(this.refreshList.bind(this));
            }.bind(this);

             $('<div>Delete this workbench upload log?</div>').dialog({
                title: "Delete?",
                modal: true,
                buttons: [
                    {text: 'Proceed', click: function() { $(this).dialog('close'); doDelete(); }},
                    {text: 'Cancel', click: function() { $(this).dialog('close'); }}
                ]
            });
        }
    });

