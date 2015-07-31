define([
    'jquery', 'underscore', 'backbone',
    'icons', 'specifyapi', 'navigation',
    'jquery-ui'
], function($, _, Backbone, icons, api, navigation) {
    "use strict";

    return Backbone.View.extend({
        __name__: "WbsDialog",
        className: "wbs-dialog table-list-dialog",
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
            var img = $('<img>', { src: '/images/Workbench32x32.png' });
            var href = '/workbench/' + wbs_entry.id + '/';
            var link = $('<a>', {href: href, 'class': "intercept-navigation"}).text(wbs_entry.get('name'));
            return $('<tr>').append($('<td>').append(img), $('<td>').append(link))[0];
        }
    });
});
