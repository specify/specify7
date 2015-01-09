define([
    'jquery', 'underscore', 'backbone', 'schema', 'queryfield', 'templates',
    'navigation', 'queryresultstable', 'jquery-bbq', 'jquery-ui'
], function($, _, Backbone, schema, QueryFieldUI, templates, navigation, QueryResultsTable) {
    "use strict";

    var setTitle;

    var QueryBuilder = Backbone.View.extend({
        __name__: "QueryBuilder",
        events: {
            'change :checkbox': 'optionChanged',
            'click .query-execute': 'search',
            'click .query-save': 'save',
            'click .field-add': 'addField',
            'click .abandon-changes': function() { this.trigger('redisplay'); }
        },
        initialize: function(options) {
            this.query = options.query;
            this.readOnly = options.readOnly;
            this.model = schema.getModel(this.query.get('contextname'));
        },
        render: function() {
            var title = 'Query: ' + this.query.get('name');
            setTitle(title);
            this.$el.append(templates.querybuilder({ cid: this.cid }));
            this.$('.querybuilder-header span').text(title);
            this.$('.querybuilder-header img').attr('src', this.model.getIcon());
            this.query.isNew() && this.$('.abandon-changes').remove();
            this.readOnly && this.$('.query-save').remove();

            this.$('button.field-add').button({
                icons: { primary: 'ui-icon-plus' }, text: false
            });

            this.query.on('saverequired', this.saveRequired, this);

            this.query.rget('fields').done(this.gotFields.bind(this));

            this.$('input[name="selectDistinct"]').prop('checked', this.query.get('selectdistinct'));
            this.$('input[name="countOnly"]').prop('checked', this.query.get('countonly'));
            return this;
        },
        gotFields: function(spqueryfields) {
            this.fields = spqueryfields;
            this.fieldUIs = spqueryfields.map(this.addFieldUI.bind(this));
            var ul = this.$('.spqueryfields');
            ul.append.apply(ul, _.pluck(this.fieldUIs, 'el'));
            ul.sortable({ update: this.updatePositions.bind(this) });
        },
        addFieldUI: function(spqueryfield) {
            this.$('.query-execute').prop('disabled', false);
            return new QueryFieldUI({
                parentView: this,
                model: this.model,
                spqueryfield: spqueryfield,
                el: $('<li class="spqueryfield">')
            }).render();
        },
        removeFieldUI: function(ui, spqueryfield) {
            this.fieldUIs = _(this.fieldUIs).without(ui);
            this.fields.remove(spqueryfield);
            this.updatePositions();
            (this.fieldUIs.length < 1) && this.$('.query-execute, .query-save').prop('disabled', true);
        },
        updatePositions: function() {
            _.invoke(this.fieldUIs, 'positionChanged');
        },
        contractFields: function() {
            _.each(this.fieldUIs, function(field) { field.expandToggle('hide'); });
        },
        deleteIncompleteFields: function() {
            _.invoke(this.fieldUIs, 'deleteIfIncomplete');
        },
        saveRequired: function() {
            this.$('.abandon-changes, .query-save').prop('disabled', false);
        },
        save: function() {
            if (this.readOnly) return;
            this.deleteIncompleteFields();
            if (this.fieldUIs.length < 1) return;
            this.query.save().done(this.trigger.bind(this, 'redisplay'));
        },
        addField: function() {
            var newField = new schema.models.SpQueryField.Resource();
            newField.set({
                sorttype: 0,
                isdisplay: true,
                isnot: false,
                startvalue: '',
                query: this.query.url()
            });
            this.fields.add(newField);

            var ui = this.addFieldUI(newField);
            this.fieldUIs.push(ui);
            this.$('.spqueryfields').append(ui.el).sortable('refresh');
            this.updatePositions();
        },
        search: function(evt) {
            this.deleteIncompleteFields();
            if (this.fieldUIs.length < 1) return;

            this.results && this.results.remove();

            this.results = new QueryResultsTable({
                model: this.model,
                scrollOnWindow: true,
                countOnly: this.query.get('countonly'),
                fetchResults: this.fetchResults(),
                fetchCount: this.fetchCount(),
                fieldSpecs: _.chain(this.fieldUIs)
                    .filter(function(f) { return f.spqueryfield.get('isdisplay'); })
                    .sortBy(function(f) { return f.spqueryfield.get('position'); })
                    .pluck('fieldSpec')
                    .value()
            });
            this.results.render().$el.appendTo(this.el);
        },
        fetchResults: function() {
            var query = this.query.toJSON();
            return function(offset) {
                query.offset = offset;
                return $.post('/stored_query/ephemeral/', JSON.stringify(query));
            };
        },
        fetchCount: function() {
            var query = this.query.toJSON();
            query.countonly = true;
            return $.post('/stored_query/ephemeral/', JSON.stringify(query));
        },
        moveField: function(queryField, dir) {
            ({
                up:   function() { queryField.$el.prev().insertAfter(queryField.el); },
                down: function() { queryField.$el.next().insertBefore(queryField.el); }
            })[dir]();
            this.updatePositions();
        },
        optionChanged: function() {
            this.query.set({
                selectdistinct: this.$('input[name="selectDistinct"]').prop('checked'),
                countonly: this.$('input[name="countOnly"]').prop('checked')
            });
        }
    });

    return function(app) {
        setTitle = app.setTitle;

        app.router.route('query/:id/', 'storedQuery', function(id) {
            (function showView() {
                var query = new schema.models.SpQuery.Resource({ id: id });
                query.fetch().fail(app.handleError).done(function() {
                    var view = new QueryBuilder({ query: query, readOnly: app.isReadOnly });
                    view.on('redisplay', showView);
                    app.setCurrentView(view);
                });
            })();
        });

        app.router.route('query/new/:table/', 'ephemeralQuery', function(table) {
            var query = new schema.models.SpQuery.Resource();
            var model = schema.getModel(table);
            query.set({
                'name': "New Query",
                'contextname': model.name,
                'contexttableid': model.tableId,
                'selectdistinct': false,
                'countonly': false,
                'specifyuser': app.user.resource_uri,
                'isfavorite': true,
                // ordinal seems to always get set to 32767 by Specify 6
                // needs to be set for the query to be visible in Specify 6
                'ordinal': 32767
            });

            var view = new QueryBuilder({ query: query, readOnly: app.isReadOnly });
            view.on('redisplay', function() { navigation.go('/query/' + query.id + '/'); });
            app.setCurrentView(view);
        });
    };
});
