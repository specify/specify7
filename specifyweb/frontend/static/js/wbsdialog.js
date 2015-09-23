define([
    'jquery', 'underscore', 'backbone', 'schema',
    'icons', 'specifyapi', 'navigation', 'editresourcedialog'
], function($, _, Backbone, schema, icons, api, navigation, EditResourceDialog) {
    "use strict";

    var NewWorkbenchDialog = Backbone.View.extend({
        __name__: "NewWorkbenchDialog",
        className: "table-list-dialog",
        events: {
            'click a': 'select'
        },
        render: function() {
            this.templates = new schema.models.WorkbenchTemplate.LazyCollection();
            this.templates.fetch({ limit: 500 }).done(this.gotTemplates.bind(this));
            return this;
        },
        gotTemplates: function() {
            var entries = this.templates.map(this.dialogEntry, this);
            $('<table>').append(entries).appendTo(this.el);
            this.$el.dialog({
                title: "Choose Workbench Template",
                maxHeight: 400,
                modal: true,
                close: function() { $(this).remove(); },
                buttons: [
                    { text: 'New', click: this.newTemplate.bind(this) },
                    { text: 'Cancel', click: function() { $(this).dialog('close'); } }
                ]
            });
        },
        dialogEntry: function(template) {
            var link = $('<a href="#">').text(template.get('name'));
            return $('<tr>').append(
                $('<td>').append(link)
            )[0];
        },
        newTemplate: function() {
        },
        select: function(event) {
            event.preventDefault();
            var i = this.$('a').index(event.currentTarget);
            var template = this.templates.at(i).clone();
            var workbench = new schema.models.Workbench.Resource();
            workbench.set({
                workbenchtemplate: template,
                specifyuser: template.get('specifyuser')
            });
            new EditResourceDialog({ resource: workbench })
                .render()
                .on('savecomplete', this.created, this);
        },
        created: function(__, workbench) {
            navigation.go('/workbench/' + workbench.id + '/');
        }
    });


    return Backbone.View.extend({
        __name__: "WbsDialog",
        className: "wbs-dialog table-list-dialog",
        initialize: function(options) {
            this.wbs = options.wbs.models;
        },
        render: function() {
            var entries = _.map(this.wbs, this.dialogEntry, this);
            $('<table>').append(entries).appendTo(this.el);
            this.$el.dialog({
                title: "Workbenches",
                maxHeight: 400,
                modal: true,
                close: function() { $(this).remove(); },
                buttons: [
                    { text: 'New', click: this.newWB.bind(this) },
                    { text: 'Cancel', click: function() { $(this).dialog('close'); } }
                ]
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
            if (ttResourceKey !== '') {
                var tt = props.getProperty(resources_prop, ttResourceKey);
                if (tt) {
                    link.attr('title', tt);
                }
            }
        },
        dialogEntry: function(wb) {
            var img = $('<img>', { src: '/images/Workbench32x32.png' });
            var href = '/workbench/' + wb.id + '/';
            var link = $('<a>', {href: href, 'class': "intercept-navigation"}).text(wb.get('name'));
            var entry = $('<tr>').append(
                $('<td>').append(img),
                $('<td>').append(link),
                $('<td class="item-count" style="display:none">'));
            _.delay(function() {
                wb.getRelatedObjectCount('workbenchrows').done(function(count) {
                    $('.item-count', entry).text('(' + count + ')').show();
                });
            }, 100);
            return entry[0];
        },
        newWB: function() {
            new NewWorkbenchDialog().render();
        }
    });
});
