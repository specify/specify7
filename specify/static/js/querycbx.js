define([
    'jquery', 'underscore', 'backbone', 'specifyapi', 'schema', 'specifyform', 'templates',
    'dataobjformatters', 'whenall', 'parseselect', 'localizeform', 'navigation',
    'cs!savebutton', 'cs!deletebutton', 'cs!saveblockers', 'cs!tooltipmgr',
    'text!context/app.resource?name=TypeSearches!noinline',
    'text!context/app.resource?name=DialogDefs!noinline',
    'jquery-ui'
], function ($, _, Backbone, api, schema, specifyform, templates, dataobjformat,
             whenAll, parseselect, localizeForm, navigation, SaveButton,
             DeleteButton, saveblockers, ToolTipMgr, typesearchxml, dialogdefxml) {
    var typesearches = $.parseXML(typesearchxml);
    var dialogdefs = $.parseXML(dialogdefxml);

    var QueryCbx = Backbone.View.extend({
        events: {
            'click .querycbx-edit': 'edit',
            'click .querycbx-add': 'add',
            'click .querycbx-search': 'search',
            'autocompleteselect': 'select',
            'blur input': 'fillIn'
        },
        select: function (event, ui) {
            var resource = ui.item.resource;
            this.model.set(this.fieldName, resource.url());
        },
        render: function () {
            var self = this;
            var control = self.$el;
            var querycbx = $(templates.querycbx());
            control.replaceWith(querycbx);
            self.setElement(querycbx);
            self.$('input').replaceWith(control);
            self.fieldName = control.attr('name');
            control.prop('readonly') && self.$('a').hide();

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
                    } else {
                        self.$('input').val('');
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
        search: function(event, ui) {
            event.preventDefault();
            var dialogDef = $('dialog[type="search"][name="' + this.relatedModel.searchDialog + '"]', dialogdefs);
            var form = $(specifyform.buildViewByName(dialogDef.attr('view')));
            localizeForm(form);
            form.find('.specify-form-header, input[value="Delete"], :submit').remove();
            $('<div title="Search">').append(form).dialog({
                width: 'auto',
                buttons: [
                    { text: "Search", click: function() {} }
                ],
                close: function() {
                    $(this).remove();
                }
            });
        },
        add: function(event, ui) {
            var self = this;
            event.preventDefault();
            var relatedModel = self.model.specifyModel.getField(self.fieldName).getRelatedModel();

            var newResource = new (api.Resource.forModel(relatedModel))();
            self.buildDialog(newResource);
        },
        buildDialog: function(resource) {
            var self = this;
            var dialogForm = specifyform.buildViewByName(resource.specifyModel.view);
            dialogForm.find('.specify-form-header:first').remove();

            var saveButton = new SaveButton({ model: resource });
            saveButton.render().$el.appendTo(dialogForm);
            saveButton.on('savecomplete', function() {
                dialog.dialog('close');
                self.model.set(self.fieldName, resource.url());
            });

            var title = (resource.isNew() ? "New " : "") + resource.specifyModel.getLocalizedName();

            if (!resource.isNew()) {
                var deleteButton = new DeleteButton({ model: resource });
                deleteButton.render().$el.appendTo(dialogForm);
                deleteButton.on('deleted', function() {
                    self.model.set(self.fieldName, null);
                    dialog.dialog('close');
                });

                title = '<a href="' + resource.viewUrl() + '"><span class="ui-icon ui-icon-link">link</span></a>'
                    + title;
            }

            self.options.populateform(dialogForm, resource);

            var dialog = $('<div>').append(dialogForm).dialog({
                width: 'auto',
                title: title,
                close: function() { $(this).remove(); }
            });

            dialog.parent().delegate('.ui-dialog-title a', 'click', function(evt) {
                evt.preventDefault();
                navigation.go(resource.viewUrl());
                dialog.dialog('close');
            });
        },
        edit: function(event, ui) {
            var self = this;
            event.preventDefault();
            self.model.rget(self.fieldName, true).done(function(related) {
                related && self.buildDialog(related);
            });
        }
    });

    return QueryCbx;
});
