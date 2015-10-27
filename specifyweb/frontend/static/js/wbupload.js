define([
    'jquery', 'underscore', 'backbone', 'q', 'moment'
], function($, _, Backbone, Q, moment) {
    "use strict";

    function showTime(timeStr) {
        return timeStr ? moment(timeStr).calendar() : '...';
    }

    var WBUploadLog = Backbone.View.extend({
        __name__: "WBUploadLog",
        initialize: function(options) {
            this.wb = options.wb;
            this.logName = options.logName;
        },
        render: function() {
            var refreshTimer = setInterval(this.refreshLog.bind(this), 5000);
            this.$el.append('<div class="upload-log" style="width: 800px;height: 600px;overflow: auto;background: white"><pre></pre></div>');
            this.$el.append(
                $('<a>download</a>')
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
                    {text: "Close", click: function() { $(this).dialog('close'); }}
                ]
            });
            this.refreshLog();
            return this;
        },
        gotLog: function(log) {
            this.$('pre').text(log);
            this.$('.upload-log').scrollTop(this.$('pre').height());
        },
        refreshLog: function() {
            $.get('/api/workbench/upload_log/' + this.logName + '/').done(this.gotLog.bind(this));
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
            var refreshTimer = setInterval(this.refreshList.bind(this), 5000);
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
                    {text: "Refresh", click: this.refreshList.bind(this)},
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
            $.post('/api/workbench/upload/' + this.wb.id + '/').done(this.refreshList.bind(this));
        },
        rowSelected: function(evt) {
            var index = this.$('tbody tr').index(evt.currentTarget);
            new WBUploadLog({logName: this.statusList[index].log_name, wb: this.wb}).render();
        }
    });
});

