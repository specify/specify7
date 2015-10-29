define([
    'jquery', 'underscore', 'backbone', 'q', 'moment'
], function($, _, Backbone, Q, moment) {
    "use strict";

    function showTime(timeStr) {
        return timeStr ? moment(timeStr).fromNow() : '...';
    }

    var WBUploadLog = Backbone.View.extend({
        __name__: "WBUploadLog",
        className: "wb-upload-log",
        initialize: function(options) {
            this.wb = options.wb;
            this.logName = options.logName;
            this.tick = 0;
        },
        render: function() {
            var refreshTimer = setInterval(this.refreshTick.bind(this), 100);
            this.$el.append('<div class="upload-log-text"><pre></pre></div>');
            this.$el.append(
                $('<p class="auto-refresh"><label><input type="checkbox" checked /> Auto-refresh</label> (<span>disabled</span>)</p>'),
                $('<a class="download">Save locally</a>')
                    .attr('href', '/api/workbench/upload_log/' + this.logName + '/')
                    .attr('download', 'workbench-upload-log.txt')
            );
            this.$el.dialog({
                title: "Upload Log",
                modal: true,
                width: 'auto',
                height: 'auto',
                close: function() {$(this).remove(); clearInterval(refreshTimer);},
                buttons: [
                    {text: "Refresh", click: this.refreshLog.bind(this)},
                    {text: "Delete", click: this.deleteLog.bind(this)},
                    {text: "Close", click: function() { $(this).dialog('close'); }}
                ]
            });
            this.refreshLog();
            return this;
        },
        gotLog: function(log) {
            this.$('pre').text(log);
            this.$('.upload-log-text').scrollTop(this.$('pre').height());
            this.tick = 50;
        },
        refreshLog: function() {
            $.get('/api/workbench/upload_log/' + this.logName + '/')
                .done(this.gotLog.bind(this))
                .fail(this.failed.bind(this));
        },
        failed: function(jqXHR) {
            if (jqXHR.status === 404) {
                this.$('pre').text("LOG NOT AVAILABLE");
                jqXHR.errorHandled = true;
            }
        },
        deleteLog: function() {
            var doDelete = function() {
                $.ajax({
                    url: '/api/workbench/upload_log/' + this.logName + '/',
                    type: 'DELETE'
                });
                this.$el.dialog('close');
            }.bind(this);

             $('<div>Delete this workbench upload log?</div>').dialog({
                title: "Delete?",
                modal: true,
                buttons: [
                    {text: 'Proceed', click: function() { $(this).dialog('close'); doDelete(); }},
                    {text: 'Cancel', click: function() { $(this).dialog('close'); }}
                ]
            });
        },
        refreshTick: function() {
            if (this.$('.auto-refresh input').prop('checked')) {
                if (this.tick-- === 0) this.refreshLog();
                this.$('.auto-refresh span').text(this.tick / 10);
            } else  {
                this.$('.auto-refresh span').text('disabled');
            }
        }
    });


    return Backbone.View.extend({
        __name__: "WBUploadView",
        events: {
            'click tbody tr': 'rowSelected'
        },
        initialize: function(options) {
            this.wb = options.wb;
        },
        render: function() {
            var refreshTimer = setInterval(this.refreshList.bind(this), 30000);
            $('<table style="width: 600px" class="wb-logs">').append(
                '<thead><tr><th>Started</th><th>Finshed</th><th>Rows Processed</th><th>Success</th></tr></thead>',
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
                    $('<td>').text(showTime(status.start_time)),
                    $('<td>').text(showTime(status.end_time)),
                    $('<td>').text(status.last_row || '...'),
                    $('<td>').text(status.end_time == null ? '...' : status.success ? "Succeeded" : "Failed"))[0];
            });
            this.$('tbody').empty().append(rows);
        },
        startUpload: function() {
            var begin = function() {
                this.$el.dialog('close');
                var wb = this.wb;
                $.post('/api/workbench/upload/' + this.wb.id + '/').done(function(logName) {
                    new WBUploadLog({logName: logName, wb: wb}).render();
                });
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
        rowSelected: function(evt) {
            var index = this.$('tbody tr').index(evt.currentTarget);
            new WBUploadLog({logName: this.statusList[index].log_name, wb: this.wb}).render();
        }
    });
});

