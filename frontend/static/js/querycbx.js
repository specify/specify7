define([
    'jquery', 'underscore', 'backbone', 'specifyapi', 'schema', 'specifyform', 'templates',
    'dataobjformatters', 'whenall', 'parseselect', 'localizeform', 'navigation',
    'cs!savebutton', 'cs!deletebutton', 'cs!saveblockers', 'cs!tooltipmgr', 'querycbxsearch',
    'text!context/app.resource?name=TypeSearches!noinline',
    'jquery-ui'
], function ($, _, Backbone, api, schema, specifyform, templates, dataobjformat,
             whenAll, parseselect, localizeForm, navigation, SaveButton,
             DeleteButton, saveblockers, ToolTipMgr, QueryCbxSearch, typesearchxml) {
    var typesearches = $.parseXML(typesearchxml);

    var QueryCbx = Backbone.View.extend({
        events: {
            'click .querycbx-edit, .querycbx-display': 'display',
            'click .querycbx-add': 'add',
            'click .querycbx-search': 'openSearch',
            'autocompleteselect': 'select',
            'blur input': 'blur'
        },
        select: function (event, ui) {
            var resource = ui.item.resource;
            this.model.set(this.fieldName, resource);
        },
        render: function () {
            var self = this;
            var control = self.$el;
            var querycbx = $(templates.querycbx());
            control.replaceWith(querycbx);
            self.setElement(querycbx);
            self.$('input').replaceWith(control);
            self.fieldName = control.attr('name');
            self.readOnly = control.prop('readonly');
            if (self.readOnly) {
                self.$('.querycbx-edit, .querycbx-add, .querycbx-search, .querycbx-clone').hide();
            } else {
                self.$('.querycbx-display').hide();
            }
            self.isRequired = self.$('input').is('.specify-required-field');

            var init = specifyform.parseSpecifyProperties(control.data('specify-initialize'));
            self.typesearch = $('[name="'+init.name+'"]', typesearches); // defines the querycbx
            if (!init.clonebtn || init.clonebtn.toLowerCase() !== "true") self.$('.querycbx-clone').hide();

            var typesearchTxt = self.typesearch.text().trim();
            var mapper = typesearchTxt ? parseselect.colToFieldMapper(typesearchTxt) : _.identity;
            self.displaycols = _(self.typesearch.attr('displaycols').split(',')).map(mapper);

            var field = self.model.specifyModel.getField(self.fieldName);
            self.relatedModel = field.getRelatedModel();
            var searchField = self.relatedModel.getField(self.typesearch.attr('searchfield'));
            control.attr('title', 'Searches: ' + searchField.getLocalizedName());

            control.autocomplete({
                minLength: 3,
                source: function (request, response) {
                    var collection = api.queryCbxSearch(self.relatedModel, searchField.name, request.term);
                    collection.fetch().pipe(function() {
                        var rendering = collection.chain().compact().map(_.bind(self.renderItem, self)).value();
                        return whenAll(rendering).done(response);
                    }).fail(function() { response([]); });
                }
            });

            self.model.on('change:' + self.fieldName.toLowerCase(), self.fillIn, self);
            self.fillIn();

            self.toolTipMgr = new ToolTipMgr(self, control).enable();
            self.saveblockerEnhancement = new saveblockers.FieldViewEnhancer(self, self.fieldName, control);
            return self;
        },
        fillIn: function () {
            var self = this;
            _.defer(function() {
                self.model.rget(self.fieldName, true).done(function(related) {
                    if (related) {
                        self.renderItem(related).done(function(item) {
                            self.$('input').val(item.value);
                        });
                        self.model.saveBlockers.remove('fieldrequired:' + self.fieldName);
                    } else {
                        self.$('input').val('');
                        self.isRequired && self.model.saveBlockers.add(
                            'fieldrequired:' + self.fieldName, self.fieldName, 'Field is required', true);
                    }
                });
            });
        },
        renderItem: function (resource) {
            var str = this.typesearch.attr('format');
            var rget = _.bind(resource.rget, resource);
            var buildLabel = str &&
                whenAll(_(this.displaycols).map(rget)).pipe(function(vals) {
                    _(vals).each(function (val) { str = str.replace(/%s/, val); });
                    return str;
                });
            var buildValue = dataobjformat(resource, this.typesearch.attr('dataobjformatter'));
            return $.when(buildLabel, buildValue).pipe(function(label, value) {
                return { label: label || value, value: value, resource: resource };
            });
        },
        openSearch: function(event, ui) {
            var self = this;
            event.preventDefault();

            if (self.dialog) {
                // if the open dialog is for search just close it and don't open a new one
                var closeOnly = self.dialog.hasClass('querycbx-dialog-search');
                self.dialog.dialog('close');
                if (closeOnly) return;
            }
            var searchTemplateResource = new (api.Resource.forModel(this.relatedModel))({}, {
                noBusinessRules: true,
                noValidation: true
            });

            self.dialog = new QueryCbxSearch({
                model: searchTemplateResource,
                populateform: this.options.populateform,
                selected: function(resource) {
                    self.model.set(self.fieldName, resource);
                }
            }).render().$el.on('remove', function() { self.dialog = null; });
        },
        add: function(event, ui) {
            var self = this;
            event.preventDefault();
            if (self.dialog) {
                // if the open dialog is for adding, just close it and don't open a new one
                var closeOnly = self.dialog.hasClass('querycbx-dialog-add');
                self.dialog.dialog('close');
                if (closeOnly) return;
            }
            var relatedModel = self.model.specifyModel.getField(self.fieldName).getRelatedModel();
            var newResource = new (api.Resource.forModel(relatedModel))();
            self.buildDialog(newResource, 'add');
        },
        buildDialog: function(resource, addOrDisplay) {
            var self = this;
            var mode = self.readOnly ? 'view' : 'edit';
            specifyform.buildViewByName(resource.specifyModel.view, null, mode).done(function(dialogForm) {
                dialogForm.find('.specify-form-header:first').remove();

                if (!self.readOnly) {
                    var saveButton = new SaveButton({ model: resource });
                    saveButton.render().$el.appendTo(dialogForm);
                    saveButton.on('savecomplete', function() {
                        dialog.dialog('close');
                        self.model.set(self.fieldName, resource);
                    });
                }

                var title = (resource.isNew() ? "New " : "") + resource.specifyModel.getLocalizedName();

                if (!resource.isNew() && !self.readOnly) {
                    var deleteButton = new DeleteButton({ model: resource });
                    deleteButton.render().$el.appendTo(dialogForm);
                    deleteButton.on('deleted', function() {
                        self.model.set(self.fieldName, null);
                        dialog.dialog('close');
                    });
                }

                self.options.populateform(dialogForm, resource);

                var dialog = self.dialog = $('<div>', {'class': 'querycbx-dialog-' + addOrDisplay})
                    .append(dialogForm).dialog({
                        width: 'auto',
                        title: title,
                        close: function() { $(this).remove(); self.dialog = null; }
                    });

                if (!resource.isNew()) {
                    dialog.closest('.ui-dialog').find('.ui-dialog-titlebar:first').prepend(
                        '<a href="' + resource.viewUrl() + '"><span class="ui-icon ui-icon-link">link</span></a>');

                    dialog.parent().delegate('.ui-dialog-title a', 'click', function(evt) {
                        evt.preventDefault();
                        navigation.go(resource.viewUrl());
                        dialog.dialog('close');
                    });
                }

            });
        },
        display: function(event, ui) {
            var self = this;
            event.preventDefault();
            if (self.dialog) {
                // if the open dialog is for display, just close it and don't open a new one
                var closeOnly = self.dialog.hasClass('querycbx-dialog-display');
                self.dialog.dialog('close');
                if (closeOnly) return;
            }
            self.model.rget(self.fieldName, true).done(function(related) {
                related && self.buildDialog(related, 'display');
            });
        },
        blur: function() {
            var val = this.$('input').val().trim();
            if (val === '' && !this.isRequired) {
                this.model.set(this.fieldName, null);
            } else {
                this.fillIn();
            }
        }
    });

    return QueryCbx;
});
