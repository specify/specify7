define([
    'jquery', 'underscore', 'backbone', 'schema', 'specifyapi', 'navigation',
    'icons', 'specifyform', 'whenall', 'cs!populateform', 'cs!savebutton',
    'cs!deletebutton', 'cs!appresource', 'jquery-ui', 'jquery-bbq'
], function($, _, Backbone, schema, api, navigation, icons, specifyform,
            whenAll, populateform, SaveButton, DeleteButton, getAppResource) {
    "use strict";

    var dialog;
    var commonDialogOpts = {
        modal: true,
        close: function() { dialog = null; $(this).remove(); }
    };

    var formsList = getAppResource('DataEntryTaskInit');

    var dialogEntry = _.template('<li><a class="intercept-navigation" <%= href %>><img src="<%= icon %>"><%= name %></a>'
                                 + '<a class="edit"><span class="ui-icon ui-icon-pencil">edit</span></a></li>');

    var RecordSetsDialog = Backbone.View.extend({
        className: "recordsets-dialog list-dialog",
        events: {
            'click a.edit': 'edit'
        },
        render: function() {
            var ul = $('<ul>');
            this.options.recordSets.each(function(recordSet) {
                var icon = schema.getModelById(recordSet.get('dbtableid')).getIcon();
                var href = 'href="/specify/recordset/' + recordSet.id + '/"';
                var entry = $(dialogEntry({ icon: icon, href: href, name: recordSet.get('name') }));
                recordSet.get('remarks') && entry.find('a').attr('title', recordSet.get('remarks'));
                ul.append(entry);
            });
            this.$el.append(ul);
            this.$el.dialog(_.extend({}, commonDialogOpts, {
                title: "Record Sets",
                maxHeight: 400,
                buttons: [
                    { text: 'New', click: function() { $(this).prop('disabled', true); openFormsDialog(); }},
                    { text: 'Cancel', click: function() { $(this).dialog('close'); }}
                ]
            }));
            return this;
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
        className: "forms-dialog list-dialog",
        events: {'click a.select': 'selected'},
        render: function() {
            var ul = $('<ul>');
            _.each(this.options.views, function(view) {
                var icon = icons.getIcon(view.attr('iconname'));
                ul.append(dialogEntry({ icon: icon, href: '', name: view.attr('title') }));
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
        selected: function(evt) {
            var index = this.$('a.select').index(evt.currentTarget);
            this.$el.dialog('close');
            var form = this.options.forms[index];
            var recordset = new (api.Resource.forModel('recordset'))();
            var model = schema.getModel(form['class'].split('.').pop());
            recordset.set('dbtableid', model.tableId);
            recordset.set('type', 0);
            dialog = new EditRecordSetDialog({ recordset: recordset });
            $('body').append(dialog.el);
            dialog.render();
        }
    });

    function openFormsDialog() {
        formsList.done(function(views) {
            views = _.map($('view', views), $);
            whenAll(_.map(views, function(view) {
                return specifyform.getView(view.attr('view')).pipe(function(form) { return form; });
            })).done(function(forms) {
                dialog && dialog.$el.dialog('close');
                dialog = new FormsDialog({ views: views, forms: forms });
                $('body').append(dialog.el);
                dialog.render();
            });
        });
    }

    var EditRecordSetDialog = Backbone.View.extend({
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
                        var url = $.param.querystring(new (api.Resource.forModel(_this.model))().viewUrl(),
                                                      {recordsetid: _this.recordset.id});
                        navigation.go(url);
                    });
                }

                var title = (_this.recordset.isNew() ? "New " : "") + _this.recordset.specifyModel.getLocalizedName();

                if (!_this.recordset.isNew() && !_this.readOnly) {
                    var deleteButton = new DeleteButton({ model: _this.recordset });
                    deleteButton.render().$el.appendTo(form);
                    deleteButton.on('deleted', function() {
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
        title: 'Data',
        icon: '/images/Data_Entry.png',
        execute: function() {
            if (dialog) return;
            var recordSets = new (api.Collection.forModel('recordset'))();
            recordSets.fetch().done(function() {
                dialog = new RecordSetsDialog({ recordSets: recordSets });
                $('body').append(dialog.el);
                dialog.render();
            });
        }
    };
});