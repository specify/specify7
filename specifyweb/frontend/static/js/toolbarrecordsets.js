define([
    'require', 'jquery', 'underscore', 'backbone', 'schema', 'navigation',
    'populateform', 'savebutton', 'deletebutton', 'formsdialog', 'specifyform',
    'jquery-ui', 'jquery-bbq'
], function(require, $, _, Backbone, schema, navigation, populateform,
            SaveButton, DeleteButton, FormsDialog, specifyform) {
    "use strict";

    var RecordSetsDialog = Backbone.View.extend({
        __name__: "RecordSetsDialog",
        className: "recordsets-dialog table-list-dialog",
        events: {
            'click a.edit': 'edit'
        },
        render: function() {
            var table = $('<table>');
            var makeEntry = this.dialogEntry.bind(this);
            this.options.recordSets.each(function(recordSet) {
                table.append(makeEntry(recordSet));
            });
            this.options.recordSets.isComplete() ||
                table.append('<tr><td></td><td>(list truncated)</td></tr>');
            this.$el.append(table);
            this.$el.dialog({
                modal: true,
                close: function() { $(this).remove(); },
                title: "Record Sets (" + this.options.recordSets._totalCount + ")",
                maxHeight: 400,
                buttons: this.buttons()
            });
            return this;
        },
        dialogEntry: function(recordSet) {
            var img = $('<img>', {src: schema.getModelById(recordSet.get('dbtableid')).getIcon()});
            var link = $('<a>', { href: "/specify/recordset/" + recordSet.id + "/" })
                    .addClass("intercept-navigation")
                    .text(recordSet.get('name'));
            var entry = $('<tr>').append(
                $('<td>').append(img),
                $('<td>').append(link),
                $('<td class="item-count" style="display:none">'));

            this.options.readOnly || entry.append('<td><a class="edit ui-icon ui-icon-pencil"></a></td>');

            recordSet.get('remarks') && entry.find('a').attr('title', recordSet.get('remarks'));
            recordSet.getRelatedObjectCount('recordsetitems').done(function(count) {
                $('.item-count', entry).text('(' + count + ')').show();
            });
            return entry;
        },
        buttons: function() {
            var buttons = this.options.readOnly ? [] : [
                { text: 'New', click: this.openFormsDialog.bind(this),
                  title: 'Create a new record set.' }
            ];
            buttons.push({ text: 'Cancel', click: function() { $(this).dialog('close'); }});
            return buttons;
        },
        openFormsDialog: function() {
             new FormsDialog().render().on('selected', function(model) {
                var recordset = new schema.models.RecordSet.Resource();
                recordset.set('dbtableid', model.tableId);
                recordset.set('type', 0);
                new EditRecordSetDialog({ recordset: recordset }).render();
            });
        },
        getIndex: function(evt, selector) {
            evt.preventDefault();
            return this.$(selector).index(evt.currentTarget);
        },
        edit: function(evt) {
            var index = this.getIndex(evt, 'a.edit');
            this.$el.dialog('close');
            new EditRecordSetDialog({ recordset: this.options.recordSets.at(index) }).render();
        }
    });

    var EditRecordSetDialog = Backbone.View.extend({
        __name__: "EditRecordSetDialog",
        className: "recordset-edit-dialog",
        initialize: function(options) {
            this.recordset = options.recordset;
            this.model = schema.getModelById(this.recordset.get('dbtableid'));
        },
        render: function() {
            specifyform.buildViewByName('RecordSet').done(this._render.bind(this));
            return this;
        },
        _render: function(form) {
            form.find('.specify-form-header:first').remove();
            var buttons = $('<div class="specify-form-buttons">').appendTo(form);

            if (!this.readOnly) {
                var saveButton = new SaveButton({ model: this.recordset });
                saveButton.render().$el.appendTo(buttons);
                saveButton.on('savecomplete', this.recordset.isNew() ?
                              this.gotoForm : this.close, this);
            }
            var title = (this.recordset.isNew() ? "New " : "") + this.recordset.specifyModel.getLocalizedName();

            if (!this.recordset.isNew() && !this.readOnly) {
                var deleteButton = new DeleteButton({ model: this.recordset });
                deleteButton.render().$el.appendTo(buttons);
                deleteButton.on('deleted', this.close, this);
            }

            populateform(form, this.recordset);

            this.$el.append(form).dialog({
                width: 'auto',
                title: title,
                modal: true,
                close: function() { $(this).remove(); }
            });
        },
        gotoForm: function() {
            // TODO: got to be a better way to get the url
            var url = $.param.querystring(new this.model.Resource().viewUrl(),
                                          {recordsetid: this.recordset.id});
            navigation.go(url);
        },
        close: function() {
            this.$el.dialog('close');
        }
    });

    return {
        task: 'recordsets',
        title: 'Record Sets',
        icon: '/images/RecordSet32x32.png',
        execute: function() {
            var app = require('specifyapp');
            var recordSets = new schema.models.RecordSet.LazyCollection({
                filters: { specifyuser: app.user.id, orderby: '-timestampcreated' }
            });
            recordSets.fetch({ limit: 5000 }) // That's a lot of record sets
                .done(function() {
                    new RecordSetsDialog({ recordSets: recordSets, readOnly: app.isReadOnly }).render();
                });
        }
    };
});
