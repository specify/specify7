define([
    'require', 'jquery', 'underscore', 'backbone', 'schema', 'navigation',
    'populateform', 'savebutton', 'deletebutton', 'formsdialog', 'specifyform',
    'jquery-ui', 'jquery-bbq'
], function(require, $, _, Backbone, schema, navigation, populateform,
            SaveButton, DeleteButton, FormsDialog, specifyform) {
    "use strict";

    var RecordSetsDialog = Backbone.View.extend({
        __name__: "RecordSetsDialog",
        className: "recordsets-dialog list-dialog",
        events: {
            'click a.edit': 'edit'
        },
        render: function() {
            var ul = $('<ul>');
            var makeEntry = this.dialogEntry.bind(this);
            this.options.recordSets.each(function(recordSet) {
                ul.append(makeEntry(recordSet));
            });
            this.options.recordSets.isComplete() || ul.append('<li>(list truncated)</li>');
            this.$el.append(ul);
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
            var entry = $('<li>').append(
                $('<a>', { href: "/specify/recordset/" + recordSet.id + "/" })
                    .addClass("intercept-navigation")
                    .text(recordSet.get('name'))
                    .prepend(img)
                    .append('<span class="item-count" style="display:none"> - </span>'));

            this.options.readOnly || entry.append('<a class="edit ui-icon ui-icon-pencil"></a>');

            recordSet.get('remarks') && entry.find('a').attr('title', recordSet.get('remarks'));
            recordSet.getRelatedObjectCount('recordsetitems').done(function(count) {
                $('.item-count', entry).append(count).show();
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
            var _this = this;

            specifyform.buildViewByName('RecordSet').done(function(form) {
                form.find('.specify-form-header:first').remove();

                if (!_this.readOnly) {
                    var saveButton = new SaveButton({ model: _this.recordset });
                    saveButton.render().$el.appendTo(form);
                    saveButton.on('savecomplete', function() {
                        // TODO: got to be a better way to get the url
                        var url = $.param.querystring(new _this.model.Resource().viewUrl(),
                                                      {recordsetid: _this.recordset.id});
                        navigation.go(url);
                    });
                }

                var title = (_this.recordset.isNew() ? "New " : "") + _this.recordset.specifyModel.getLocalizedName();

                if (!_this.recordset.isNew() && !_this.readOnly) {
                    var deleteButton = new DeleteButton({ model: _this.recordset });
                    deleteButton.render().$el.appendTo(form);
                    deleteButton.on('deleting', function() {
                        _this.$el.dialog('close');
                    });
                }

                populateform(form, _this.recordset);

                _this.$el.append(form).dialog({
                    width: 'auto',
                    title: title,
                    modal: true,
                    close: function() { $(this).remove(); }
                });

            });
            return this;
        }
    });

    return {
        task: 'recordsets',
        title: 'Records',
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
