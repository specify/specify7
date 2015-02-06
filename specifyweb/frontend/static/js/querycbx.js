define([
    'require', 'jquery', 'underscore', 'backbone', 'specifyapi', 'schema', 'specifyform',
    'templates', 'dataobjformatters', 'whenall', 'parseselect', 'localizeform', 'navigation',
    'savebutton', 'deletebutton', 'saveblockers', 'tooltipmgr', 'querycbxsearch', 'queryfieldspec',
    'text!context/app.resource?name=TypeSearches!noinline',
    'jquery-ui'
], function (require, $, _, Backbone, api, schema, specifyform, templates,
             dataobjformatters, whenAll, parseselect, localizeForm, navigation, SaveButton,
             DeleteButton, saveblockers, ToolTipMgr, QueryCbxSearch, QueryFieldSpec, typesearchxml) {
    var typesearches = $.parseXML(typesearchxml);
    var dataobjformat = dataobjformatters.format;

    function makeQuery(model, searchFieldStr, q) {
        var query = new schema.models.SpQuery.Resource();
        query.set({
            'name': "Ephemeral QueryCBX query",
            'contextname': model.name,
            'contexttableid': model.tableId,
            'selectdistinct': false,
            'countonly': false,
            'specifyuser': null,
            'isfavorite': false,
            'ordinal': null,
            'limit': 0
        });
        var fields = query._rget(['fields']); // Cheating, but I don't want to deal with the pointless promise.

        var searchFieldSpec = QueryFieldSpec.fromPath([model.name].concat(searchFieldStr.split('.')));
        var searchField = new schema.models.SpQueryField.Resource();
        searchField.set(searchFieldSpec.toSpQueryAttrs()).set({
            'sorttype': 0,
            'isdisplay': false,
            'isnot': false,
            'startvalue': q,
            'operstart': 15,
            'position': 0
        });
        fields.add(searchField);

        var dispFieldSpec = QueryFieldSpec.fromPath([model.name]);
        var dispField = new schema.models.SpQueryField.Resource();
        dispField.set(dispFieldSpec.toSpQueryAttrs()).set({
            'sorttype': 1,
            'isdisplay': true,
            'isnot': false,
            'startvalue': '',
            'operstart': 0,
            'position': 1
        });
        fields.add(dispField);

        return query;
    }

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
            var control = this.$el;
            var querycbx = $(templates.querycbx());
            control.replaceWith(querycbx);
            this.setElement(querycbx);
            this.$('input').replaceWith(control);
            this.fieldName = control.attr('name');
            this.readOnly = control.prop('readonly');
            this.inFormTable = control.hasClass('specify-field-in-table');
            if (this.readOnly || this.inFormTable) {
                this.$('.querycbx-edit, .querycbx-add, .querycbx-search, .querycbx-clone').hide();
            }
            if (!this.readOnly || this.inFormTable) {
                this.$('.querycbx-display').hide();
            }
            this.isRequired = this.$('input').is('.specify-required-field');

            var init = specifyform.parseSpecifyProperties(control.data('specify-initialize'));
            var typesearch = this.typesearch = $('[name="'+init.name+'"]', typesearches); // defines the querycbx
            if (!init.clonebtn || init.clonebtn.toLowerCase() !== "true") this.$('.querycbx-clone').hide();

            var field = this.model.specifyModel.getField(this.fieldName);
            var relatedModel = this.relatedModel = field.getRelatedModel();
            var selectStmt = this.typesearch.text();
            var mapper = selectStmt ? parseselect.colToFieldMapper(this.typesearch.text()) : _.identity;
            var searchFieldStrs = _.map(this.typesearch.attr('searchfield').split(','), mapper);
            var searchFields = _.map(searchFieldStrs, this.relatedModel.getField, this.relatedModel);
            var fieldTitles = _.map(searchFields, function(f) {
                return (f.model === relatedModel ? '' : f.model.getLocalizedName() + " / ") + f.getLocalizedName();
            });
            control.attr('title', 'Searches: ' + fieldTitles.join(', '));

            control.autocomplete({
                minLength: 3,
                source: function (request, response) {
                    var queries = _.map(searchFieldStrs, function(s) {
                        var json = JSON.stringify(makeQuery(relatedModel, s, request.term));
                        return $.post('/stored_query/ephemeral/', json).pipe(function(data) { return data; });
                    });
                    whenAll(queries).done(function(resps) {
                        var data = _.pluck(resps, 'results');
                        var allResults = _.reduce(data, function(a, b) { return a.concat(b); }, []);
                        var items = _.map(allResults, function(row) {
                            return { label: row[1], value: row[1],
                                     resource: new relatedModel.Resource({ id: row[0] }) };
                        });
                        response(items);
                    });
                }
            });

            this.model.on('change:' + this.fieldName.toLowerCase(), this.fillIn, this);
            this.fillIn();

            this.toolTipMgr = new ToolTipMgr(this, control).enable();
            this.saveblockerEnhancement = new saveblockers.FieldViewEnhancer(this, this.fieldName, control);
            return this;
        },
        fillIn: function () {
            var _this = this;
            function fillIn() {
                _this.model.rget(_this.fieldName, true).done(function(related) {
                    if (related) {
                        _this.renderItem(related).done(function(item) {
                            _this.$('input').val(item.value);
                        });
                        _this.model.saveBlockers.remove('fieldrequired:' + _this.fieldName);
                    } else {
                        _this.$('input').val('');
                        _this.isRequired && _this.model.saveBlockers.add(
                            'fieldrequired:' + _this.fieldName, _this.fieldName, 'Field is required', true);
                    }
                });
            }
            _.defer(fillIn);
        },
        renderItem: function (resource) {
            var rget = resource.rget.bind(resource);
            return dataobjformat(resource, this.typesearch.attr('dataobjformatter')).pipe(function(formatted) {
                return { label: formatted, value: formatted, resource: resource };
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
