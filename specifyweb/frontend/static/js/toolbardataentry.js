define([
    'require', 'jquery', 'underscore', 'backbone', 'schema', 'navigation',
    'icons', 'specifyform', 'whenall', 'populateform', 'savebutton',
    'deletebutton', 'appresource', 'jquery-ui', 'jquery-bbq'
], function(require, $, _, Backbone, schema, navigation, icons, specifyform,
            whenAll, populateform, SaveButton, DeleteButton, getAppResource) {
    "use strict";

    var dialog;
    var commonDialogOpts = {
        modal: true,
        close: function() { dialog = null; $(this).remove(); }
    };

    var formsList = getAppResource('DataEntryTaskInit');

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
            this.$el.dialog(_.extend({}, commonDialogOpts, {
                title: "Record Sets (" + this.options.recordSets._totalCount + ")",
                maxHeight: 400,
                buttons: this.buttons()
            }));
            return this;
        },
        dialogEntry: function(recordSet) {
            var img = $('<img>', { src: schema.getModelById(recordSet.get('dbtableid')).getIcon() });
            var entry = $('<li>').append(
                $('<a>', { href: "/specify/recordset/" + recordSet.id + "/" })
                    .addClass("intercept-navigation")
                    .text(recordSet.get('name'))
                    .prepend(img)
                    .append('<span class="item-count" style="display:none"> - </span>'));

            this.options.readOnly || entry.append(
                '<a class="edit"><span class="ui-icon ui-icon-pencil">edit</span></a></li>');

            recordSet.get('remarks') && entry.find('a').attr('title', recordSet.get('remarks'));
            recordSet.getRelatedObjectCount('recordsetitems').done(function(count) {
                $('.item-count', entry).append(count).show();
            });
            return entry;
        },
        buttons: function() {
            var buttons = this.options.readOnly ? [] : [
                { text: 'Skip', click: this.openFormsDialog.bind(this, false),
                  title: 'Add new items directly to the database without any record set.' },
                { text: 'New', click: this.openFormsDialog.bind(this, true),
                  title: 'Create a new record set.' }
            ];
            buttons.push({ text: 'Cancel', click: function() { $(this).dialog('close'); }});
            return buttons;
        },
        openFormsDialog: function(createRS) {
            this.$el.parent().find('.ui-button').addClass('ui-state-disabled').prop('disabled', true);

            formsList.done(function(views) {
                views = _.map($('view', views), $);
                whenAll(_.map(views, function(view) {
                    return specifyform.getView(view.attr('view')).pipe(function(form) { return form; });
                })).done(function(forms) {
                    dialog && dialog.$el.dialog('close');
                    dialog = new FormsDialog({ views: views, forms: forms, createRecordSet: createRS });
                    $('body').append(dialog.el);
                    dialog.render();
                });
            });
        },
        getIndex: function(evt, selector) {
            evt.preventDefault();
            return this.$(selector).index(evt.currentTarget);
        },
        edit: function(evt) {
            var index = this.getIndex(evt, 'a.edit');
            this.$el.dialog('close');
            dialog = new EditRecordSetDialog({ recordset: this.options.recordSets.at(index) });
            $('body').append(dialog.el);
            dialog.render();
        }
    });

    var FormsDialog = Backbone.View.extend({
        __name__: "FormsDialog",
        className: "forms-dialog list-dialog",
        events: {'click a': 'selected'},
        render: function() {
            var ul = $('<ul>');
            var makeEntry = this.dialogEntry.bind(this);
            _.each(this.options.views, function(view) {
                ul.append($('<li>').append(makeEntry(view)));
            });
            ul.find('a.edit').remove();
            this.$el.append(ul);
            this.$el.dialog(_.extend({}, commonDialogOpts, {
                title: "Forms",
                maxHeight: 400,
                buttons: [{ text: 'Cancel', click: function() { $(this).dialog('close'); } }]
            }));
            return this;
        },
        dialogEntry: function(view) {
            var img = $('<img>', { src: icons.getIcon(view.attr('iconname')) });
            return $('<a>').addClass("intercept-navigation").text(view.attr('title')).prepend(img);
        },
        selected: function(evt) {
            var index = this.$('a').index(evt.currentTarget);
            this.$el.dialog('close');
            var form = this.options.forms[index];
            var model = schema.getModel(form['class'].split('.').pop());
            if(this.options.createRecordSet) {
                var recordset = new schema.models.RecordSet.Resource();
                recordset.set('dbtableid', model.tableId);
                recordset.set('type', 0);
                dialog = new EditRecordSetDialog({ recordset: recordset });
                $('body').append(dialog.el);
                dialog.render();
            } else {
                navigation.go(new model.Resource().viewUrl());
            }
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
                        dialog.$el.dialog('close');
                        dialog = null;
                    });
                }

                populateform(form, _this.recordset);

                _this.$el.append(form).dialog(_.extend({}, commonDialogOpts, {
                        width: 'auto',
                        title: title
                }));

            });
            return this;
        }
    });

    return {
        task: 'data',
        title: 'Data',
        icon: '/images/Data_Entry.png',
        execute: function() {
            if (dialog) return;
            var app = require('specifyapp');
            var recordSets = new schema.models.RecordSet.LazyCollection({
                filters: { specifyuser: app.user.id, orderby: '-timestampcreated' }
            });
            recordSets.fetch({ limit: 5000 }) // That's a lot of record sets
                .done(function() {
                    dialog = new RecordSetsDialog({ recordSets: recordSets, readOnly: app.isReadOnly });
                    $('body').append(dialog.el);
                    dialog.render();
                });
        }
    };
});
