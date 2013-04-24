define([
    'jquery', 'underscore', 'backbone', 'navigation', 'schema', 'queryfield', 'templates',
    'specifyapi', 'cs!fieldformat', 'cs!savebutton', 'whenall', 'scrollresults',
    'jquery-bbq', 'jquery-ui'
], function($, _, Backbone, navigation, schema, QueryFieldUI, templates,
            api, fieldformat, SaveButton, whenAll, ScrollResults) {
    "use strict";

    var Results = Backbone.View.extend({
        events: {
            'click a.query-result': 'navToResult'
        },
        initialize: function(options) {
            this.fieldUIs = options.fieldUIs;
            this.model = options.model;
        },
        detectEndOfResults: function(results) {
            return results.length < 2;
        },
        addResults: function(results) {
            var self = this;
            var columns = results.shift();
            var fieldToCol = function(fieldUI) {
                return _(columns).indexOf(fieldUI.spqueryfield.id);
            };

            _.each(results, function(result) {
                var row = $('<tr>').appendTo(self.el);
                var resource = new (api.Resource.forModel(self.model))({
                    id: result[0]
                });
                var href = resource.viewUrl();
                _.each(self.fieldUIs, function(fieldUI) {
                    if (!fieldUI.spqueryfield.get('isdisplay')) return;
                    var value = result[fieldToCol(fieldUI)];
                    var field = fieldUI.getField();
                    if (field) {
                        value = fieldformat(field, value);
                    }
                    row.append($('<td>').append($('<a>', {
                        href: href,
                        "class": "query-result"
                    }).text(value)));
                });
            });
            return results.length;
        },
        navToResult: function(evt) {
            evt.preventDefault();
            return navigation.go($(evt.currentTarget).prop('href'));
        }
    });

    var StoredQueryView = Backbone.View.extend({
        events: {
            'click .query-execute': 'search',
            'click .field-add': 'addField',
            'click .abandon-changes': function() { this.trigger('redisplay'); }
        },
        initialize: function(options) {
            var self = this;
            self.query = options.query;
            self.model = schema.getModel(self.query.get('contextname'));
            self.saveButton = new SaveButton({ model: self.query });
            self.saveButton.on('savecomplete', function() { this.trigger('redisplay'); }, this);
        },
        render: function() {
            var self = this;
            $('<h2>').text(self.query.get('name')).appendTo(self.el);
            self.$el.append(templates.querybuilder());
            self.$('.querybuilder').append(self.saveButton.render().el);

            self.$('button.field-add').button({
                icons: { primary: 'ui-icon-plus' }, text: false
            });

            self.query.on('saverequired', this.saveRequired, this);

            self.query.rget('fields', true).done(function(spqueryfields) {
                self.fields = spqueryfields;
                self.fieldUIs = spqueryfields.map(function(spqueryfield) {
                    var ui = new QueryFieldUI({
                        parentView: self,
                        model: self.model,
                        spqueryfield: spqueryfield,
                        el: $('<li class="spqueryfield">')
                    });
                    ui.on('remove', function(ui, field) { self.fields.remove(field); });
                    return ui.render();
                });

                var ul = self.$('.spqueryfields');
                ul.append.apply(ul, _.pluck(self.fieldUIs, 'el'));

                self.$('ul.sortable').sortable({
                    connectWith: 'ul.sortable',
                    items: '.spqueryfield',
                    distance: 20,
                    update: function (event, ui) {
                        self.trigger('positionschanged');
                    },
                    start: function(evt, ui) { self.$('.spqueryfield-delete').show('blind', 250); },
                    stop: function(evt, ui) { self.$('.spqueryfield-delete').hide('blind', 200); }
                });
            });

            $('<table class="results" width="100%"></div>').appendTo(self.el);
            self.$el.append(
                '<div style="text-align: center" class="fetching-more"><img src="/static/img/specify128spinner.gif"></div>');
            self.$('.fetching-more').hide();
            return self;
        },
        saveRequired: function() {
            this.$('.query-execute').prop('disabled', true);
            this.$('.abandon-changes').prop('disabled', false);
        },
        addField: function() {
            var newField = new (api.Resource.forModel('spqueryfield'))();
            newField.set({sorttype: 0, isdisplay: true, query: this.query.url()});

            var addFieldUI = new QueryFieldUI({
                parentView: this,
                model: this.model,
                el: $('<li class="spqueryfield">'),
                spqueryfield: newField
            });
            this.$('.spqueryfields').append(addFieldUI.render().el).sortable('refresh');
            addFieldUI.on('completed', function() { this.fields.add(newField); }, this);
            this.trigger('positionschanged');
        },
        renderHeader: function() {
            var header = $('<tr>');
            _.each(this.fieldUIs, function(fieldUI) {
                if (!fieldUI.spqueryfield.get('isdisplay')) return;
                var field = fieldUI.getField();
                var icon = field.model.getIcon();
                var name = fieldUI.treeRank || field.getLocalizedName();
                fieldUI.datePart && ( name += ' (' + fieldUI.datePart + ')' );
                $('<th>').text(name).prepend($('<img>', {src: icon})).appendTo(header);
            });
            return header;
        },
        search: function(evt) {
            var self = this;
            var table = self.$('table.results');

            table.empty();
            table.append(self.renderHeader());

            var ajaxUrl = "/stored_query/query/" + self.query.id + "/";
            var view = new ScrollResults({
                View: Results,
                el: table,
                viewOptions: {fieldUIs: self.fieldUIs, model: self.model},
                ajaxUrl: ajaxUrl
            }).render()
                .on('fetching', function() { this.$('.fetching-more').show(); }, this)
                .on('gotdata', function() { this.$('.fetching-more').hide(); }, this);

            view.fetchMoreWhileAppropriate();
        }
    });

    return function(app) {
        app.router.route('query/:id/', 'storedQuery', function(id) {
            function doIt() {
                var query = new (api.Resource.forModel('spquery'))({ id: id });
                query.fetch().fail(app.handleError).done(function() {
                    app.setCurrentView(new StoredQueryView({ query: query }));
                    app.getCurrentView().on('redisplay', doIt);
                });
            }
            doIt();
        });
    };
});
