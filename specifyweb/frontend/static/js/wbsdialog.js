define([
    'jquery', 'underscore', 'backbone',
    'icons', 'specifyapi', 'wbform',
    'jquery-ui'
], function($, _, Backbone, icons, api, WbForm) {
    "use strict";


    return Backbone.View.extend({
        __name__: "WbsDialog",
        className: "wbs-dialog table-list-dialog",
        events: {
            'click a.intercept-navigation': 'selected'
        },
        render: function() {
            var entries = _.map(this.options.wbs.models, this.dialogEntry, this);
            $('<table>').append(entries).appendTo(this.el);
            this.$el.dialog({
                title: "Workbenches",
                maxHeight: 400,
                modal: true,
                close: function() { $(this).remove(); },
                buttons: [{ text: 'Cancel', click: function() { $(this).dialog('close'); } }]
            });
            return this;
        },
        getDialogEntryText: function(entry) {
            if (entry.attr('label')) {
                return props.getProperty(resources_prop, entry.attr('label'));
            } else if (entry.attr('table')) {
                return schema.getModel(entry.attr('table')).getLocalizedName();
            } else if (isActionEntry(entry)) {
                return entry.attr('action');
            } else {
                return entry.attr('table');
            }
        },
        addDialogEntryToolTip: function(entry, link) {
            var ttResourceKey = entry.attr('tooltip');
            if (ttResourceKey != '') {
                var tt = props.getProperty(resources_prop, ttResourceKey);
                if (tt) {
                    link.attr('title', tt);
                }
            }
        },
        dialogEntry: function(wbs_entry) {
            var img = $('<img>', { src: icons.getIcon('Workbench32x32.png') });
            var link = $('<a>').addClass("intercept-navigation").text(wbs_entry.get('name'));
            return $('<tr>').append($('<td>').append(img), $('<td>').append(link))[0];
        },
        selected: function(evt) {
            var index = this.$('a').index(evt.currentTarget);
            this.$el.dialog('close');
            var wbid = this.options.wbs.models[index].get('id');
            var rows = api.getWbRows(wbid).done(function(wb) {
                new WbForm({ wbid: wbid, data: wb }).render();
            });
        }
    });
});
