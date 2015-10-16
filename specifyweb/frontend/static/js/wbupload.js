define([
    'jquery', 'underscore', 'backbone', 'q', 'moment'
], function($, _, Backbone, Q, moment) {
    "use strict";

    function showTime(timeStr) {
        return timeStr ? moment(timeStr).fromNow() : '...';
    }


    return Backbone.View.extend({
        __name__: "WBUploadView",
        events: {},
        initialize: function(options) {
            this.wb = options.wb;
        },
        render: function() {
            var refreshTimer = setInterval(this.refreshList.bind(this), 5000);
            $('<table style="width: 600px">').append(
                '<thead><tr><th>Started</th><th>Finshed</th><th>Rows Processed</th><th>Success</th></tr></thead>',
                '<tbody>'
            ).appendTo(this.el);
            this.$el.dialog({
                title: "Upload Log",
                modal: true,
                width: 'auto',
                height: 600,
                close: function() {$(this).remove(); clearInterval(refreshTimer); },
                buttons: [
                    {text: "Refresh", click: this.refreshList.bind(this)},
                    {text: "Start Upload", click: this.startUpload.bind(this)},
                    {text: "Cancel", click: function() { $(this).dialog('close'); }}
                ]
            });
            this.refreshList();
            return this;
        },
        refreshList: function() {
            $.get('/api/workbench/upload_status_list/' + this.wb.id + '/').done(this.gotStatusList.bind(this));
        },
        gotStatusList: function(statusList) {
            var rows = _.map(_(statusList).sortBy('start_time'), function(status) {
                return $('<tr>').append(
                    $('<td>').text(showTime(status.start_time)),
                    $('<td>').text(showTime(status.end_time)),
                    $('<td>').text(status.last_row || '...'),
                    $('<td>').text(status.end_time == null ? '...' : status.success ? "Succeded" : "Failed"))[0];
            });
            this.$('tbody').empty().append(rows);
        },
        startUpload: function() {
            $.post('/api/workbench/upload/' + this.wb.id + '/').done(this.refreshList.bind(this));
        }
    });
});

