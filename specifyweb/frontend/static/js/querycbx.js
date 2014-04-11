define([
    'require', 'jquery', 'underscore', 'backbone', 'specifyapi', 'schema', 'specifyform',
    'templates', 'dataobjformatters', 'whenall', 'parseselect', 'localizeform', 'navigation',
    'savebutton', 'deletebutton', 'saveblockers', 'tooltipmgr', 'querycbxsearch',
    'text!context/app.resource?name=TypeSearches!noinline',
    'jquery-ui'
], function (require, $, _, Backbone, api, schema, specifyform, templates,
             dataobjformatters, whenAll, parseselect, localizeForm, navigation, SaveButton,
             DeleteButton, saveblockers, ToolTipMgr, QueryCbxSearch, typesearchxml) {
    var typesearches = $.parseXML(typesearchxml);
    var dataobjformat = dataobjformatters.format;

    var QueryCbx = Backbone.View.extend({
        __name__: "QueryCbx",
        events: {
            'click .querycbx-edit, .querycbx-display, .querycbx-add': 'display',
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
            self.inFormTable = control.hasClass('specify-field-in-table');
            if (self.readOnly || self.inFormTable) {
                self.$('.querycbx-edit, .querycbx-add, .querycbx-search, .querycbx-clone').hide();
            }
            if (!self.readOnly || self.inFormTable) {
                self.$('.querycbx-display').hide();
            }
            self.isRequired = self.$('input').is('.specify-required-field');

            var init = specifyform.parseSpecifyProperties(control.data('specify-initialize'));
            self.typesearch = $('[name="'+init.name+'"]', typesearches); // defines the querycbx
            if (!init.clonebtn || init.clonebtn.toLowerCase() !== "true") self.$('.querycbx-clone').hide();

            var typesearchTxt = self.typesearch.text().trim();
            var mapper = typesearchTxt ? parseselect.colToFieldMapper(typesearchTxt) : _.identity;
            var displaycolsRaw = _.map(self.typesearch.attr('displaycols').split(','), function trim(s) {
                return s.trim();
            });

            self.displaycols = _(displaycolsRaw).map(mapper);

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
            var rget = resource.rget.bind(resource);
            var buildLabel = str &&
                whenAll(_(this.displaycols).map(rget)).pipe(function(vals) {
                    // TODO: utilize precision values for %f format fields.
                    // I tried using sprintf.js for this, but couldn't get
                    // to handle nulls nicely.
                    _(vals).each(function (val) { str = str.replace(/(%s)|(%[0-9\.]*f)/, val || ''); });
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
            var searchTemplateResource = new this.relatedModel.Resource({}, {
                noBusinessRules: true,
                noValidation: true
            });

            self.dialog = new QueryCbxSearch({
                model: searchTemplateResource,
                selected: function(resource) {
                    self.model.set(self.fieldName, resource);
                }
            }).render().$el.on('remove', function() { self.dialog = null; });
        },
        display: function(event, ui) {
            event.preventDefault();
            var mode = $(event.currentTarget).is('.querycbx-add')? 'add' : 'display';
            if (this.dialog) {
                // if the open dialog is for selected mode, just close it and don't open a new one
                var closeOnly = this.dialog.hasClass('querycbx-dialog-' + mode);
                this.dialog.dialog('close');
                if (closeOnly) return;
            }

            var related;
            if (mode === 'add') {
                related = new this.relatedModel.Resource();
            } else {
                var uri = this.model.get(this.fieldName);
                if (!uri) return;
                related = this.relatedModel.Resource.fromUri(uri);
            }

            this.dialog = $('<div>', {'class': 'querycbx-dialog-' + mode});

            new (require('resourceview'))({
                el: this.dialog,
                model: related,
                mode: this.readOnly ? 'view' : 'edit',
                noHeader: true
            }).render()
                .on('saved', this.resourceSaved, this)
                .on('deleted', this.resourceDeleted, this)
                .on('changetitle', this.changeDialogTitle, this);

            var _this = this;
            this.dialog.dialog({
                position: { my: "left top", at: "left+20 top+20", of: $('#content') },
                width: 'auto',
                close: function() { $(this).remove(); _this.dialog = null; }
            }).parent().delegate('.ui-dialog-title a', 'click', function(evt) {
                evt.preventDefault();
                navigation.go(related.viewUrl());
                _this.dialog.dialog('close');
            });

            if (!related.isNew()) {
                $('<a>', { href: related.viewUrl() })
                    .addClass('intercept-navigation')
                    .append('<span class="ui-icon ui-icon-link">link</span>')
                    .prependTo(this.dialog.closest('.ui-dialog').find('.ui-dialog-titlebar:first'));
            }
        },
        resourceSaved: function(related) {
            this.dialog.dialog('close');
            this.model.set(this.fieldName, related);
            this.fillIn();
        },
        resourceDeleted: function() {
            this.dialog.dialog('close');
            this.model.set(this.fieldName, null);
            this.fillIn();
        },
        changeDialogTitle: function(title) {
            this.dialog && this.dialog.dialog('option', 'title', title);
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
