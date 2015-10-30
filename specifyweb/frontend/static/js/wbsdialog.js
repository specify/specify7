define([
    'jquery', 'underscore', 'backbone', 'schema', 'navigation',
    'editresourcedialog', 'wbtemplateeditor'
], function(
    $, _, Backbone, schema, navigation,
    EditResourceDialog, WBTemplateEditor
) {
    "use strict";

    var ImportWorkbenchDialog = Backbone.View.extend({
        __name__: "ImportWorkbenchDialog",
        events: {
            'change :file': 'fileSelected'
        },
        initialize: function(options) {
            this.template = options.template;
        },
        render: function() {
            this.$el.append('<form enctype="multipart/form-data"><input type="file" name="file"></form>')
                .dialog({
                    modal: true,
                    title: 'Import Workbench'
                });
            return this;
        },
        fileSelected: function() {
            var files = this.$(':file').get(0).files;
            if (files.length === 0) return;
            this.$el.text('Uploading...');
            var formData = new FormData();
            formData.append('file', files[0]);
            formData.append('template', JSON.stringify(this.template.toJSON()));
            $.ajax({
                url: '/api/workbench/import/',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false
            });
        }
    });

    var NewWorkbenchDialog = Backbone.View.extend({
        __name__: "NewWorkbenchDialog",
        className: "table-list-dialog",
        events: {
            'click a': 'select'
        },
        initialize: function(options) {
            this.importing = options.importing;
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
            var editor = new WBTemplateEditor();
            editor.render().$el.dialog({
                title: 'Workbench Template Mappings',
                width: 'auto',
                modal: true,
                close: function() { $(this).remove(); },
                buttons: [
                    {text: 'Done', click: function() { this.makeWorkbench(editor.makeTemplate()); }.bind(this) },
                    {text: 'Cancel', click: function() { $(this).dialog('close'); }}
                ]
            });
        },
        select: function(event) {
            event.preventDefault();
            var i = this.$('a').index(event.currentTarget);
            var template = this.templates.at(i).clone();
            if (this.importing) {
                new ImportWorkbenchDialog({template: template}).render();
            } else {
                this.makeWorkbench(template);
            }
        },
        makeWorkbench: function(template) {
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
        events: {
            'click a.edit': 'edit'
        },
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
                    { text: 'Import', click: this.newWB.bind(this, true) },
                    { text: 'Cancel', click: function() { $(this).dialog('close'); } }
                ]
            });
            return this;
        },
        dialogEntry: function(wb) {
            var img = $('<img>', { src: '/images/Workbench32x32.png' });
            var href = '/workbench/' + wb.id + '/';
            var link = $('<a>', {href: href, 'class': "intercept-navigation"}).text(wb.get('name'));
            var entry = $('<tr>').append(
                $('<td>').append(img),
                $('<td>').append(link),
                $('<td class="item-count" style="display:none">'));

            this.options.readOnly || entry.append('<td><a class="edit ui-icon ui-icon-pencil"></a></td>');

            _.delay(function() {
                wb.getRelatedObjectCount('workbenchrows').done(function(count) {
                    $('.item-count', entry).text('(' + count + ')').show();
                });
            }, 100);
            return entry[0];
        },
        newWB: function(importing) {
            new NewWorkbenchDialog({importing: importing}).render();
        },
        getIndex: function(evt, selector) {
            evt.preventDefault();
            return this.$(selector).index(evt.currentTarget);
        },
        edit: function(evt) {
            var index = this.getIndex(evt, 'a.edit');
            this.$el.dialog('close');
            new EditResourceDialog({ resource: this.wbs[index] }).render();
        }
    });
});
