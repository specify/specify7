define([
    'jquery', 'underscore', 'backbone', 'schema', 'queryfield', 'templates',
    'fieldformat', 'dataobjformatters', 'navigation', 'whenall', 'scrollresults',
    'jquery-bbq', 'jquery-ui'
], function($, _, Backbone, schema, QueryFieldUI, templates, fieldformat, 
            dataobjformatters, navigation, whenAll, ScrollResults) {
    "use strict";
    var objformat = dataobjformatters.format, aggregate = dataobjformatters.aggregate;

    var Results = Backbone.View.extend({
        __name__: "QueryResultsView",
        initialize: function(options) {
            this.fieldUIs = options.fieldUIs;
            this.model = options.model;
        },
        detectEndOfResults: function(results) {
            $('.query-results-count').text(results.count);
            return results.results.length < 1;
        },
        addResults: function(results) {
            _.each(results.results, function(result) {
                var row = $('<tr>').appendTo(this.el);
                var resource = new this.model.Resource({ id: result[0] });
                var href = resource.viewUrl();
                _.chain(this.fieldUIs)
                    .filter(function(f) { return f.spqueryfield.get('isdisplay'); })
                    .sortBy(function(f) { return f.spqueryfield.get('position'); })
                    .each(function(fieldUI, i) {
                        var cell = this.makeCell(href, fieldUI, result[i + 1]);
                        $('<td>').appendTo(row).append(cell);
                    }, this);
            }, this);
            return results.results.length;
        },
        makeCell: function(rowHref, cellFieldUI, cellValue) {
            var field = cellFieldUI.getField();
            var cell = $('<a class="intercept-navigation query-result">')
                    .prop('href', rowHref);

            if (cellFieldUI.formattedRecord) {
                (field.type === 'many-to-one') ?
                    this.setupToOneCell(cell, field, cellValue) :
                    this.setupToManyCell(cell, field, cellValue);
            } else {
                field && ( cellValue = fieldformat(field, cellValue) );
                cell.text(cellValue);
            }
            return cell;
        },
        setupToOneCell: function(cell, field, cellValue) {
            if (cellValue == null) return;
            var resource = new (field.getRelatedModel().Resource)({ id: cellValue });
            cell.prop('href', resource.viewUrl()).text('(loading...)');
            objformat(resource).done(function(formatted) { cell.text(formatted); });
        },
        setupToManyCell: function(cell, field, cellValue) {
            if (cellValue == null) return;
            cell.text('(loading...)');
            var parentResource = new field.model.Resource({ id: cellValue });
            parentResource.rget(field.name, true).pipe(aggregate).done(function(formatted) {
                cell.text(formatted);
            });
        }
    });

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
            this.model = schema.getModel(this.query.get('contextname'));
        },
        render: function() {
            document.title = 'Query: ' + this.query.get('name');
            this.$el.append(templates.querybuilder({ cid: this.cid }));
            this.$('.querybuilder-header span').text(document.title);
            this.$('.querybuilder-header img').attr('src', this.model.getIcon());
            this.query.isNew() && this.$('.abandon-changes').remove();

            this.$('button.field-add').button({
                icons: { primary: 'ui-icon-plus' }, text: false
            });

            this.query.on('saverequired', this.saveRequired, this);

            this.query.rget('fields').done(this.gotFields.bind(this));

            this.$('input[name="selectDistinct"]').prop('checked', this.query.get('selectdistinct'));
            this.$('input[name="countOnly"]').prop('checked', this.query.get('countonly'));

            this.$('.fetching-more').hide();
            return this;
        },
        gotFields: function(spqueryfields) {
            this.fields = spqueryfields;
            this.fieldUIs = spqueryfields.map(this.addFieldUI.bind(this));
            var ul = this.$('.spqueryfields');
            ul.append.apply(ul, _.pluck(this.fieldUIs, 'el'));
            ul.sortable({ update: this.updatePositions.bind(this) });
            _.defer(this.contractFields.bind(this));
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
            this.deleteIncompleteFields();
            if (this.fieldUIs.length < 1) return;
            this.query.save().done(this.trigger.bind(this, 'redisplay'));
        },
        addField: function() {
            this.contractFields();
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
        renderHeader: function() {
            var header = $('<tr>');
            _.chain(this.fieldUIs)
                .filter(function(f) { return f.spqueryfield.get('isdisplay'); })
                .sortBy(function(f) { return f.spqueryfield.get('position'); })
                .each(function(fieldUI) { header.append(fieldUI.renderHeader()); });
            return header;
        },
        search: function(evt) {
            this.deleteIncompleteFields();
            if (this.fieldUIs.length < 1) return;

            var table = this.$('table.query-results');
            this.$('h3').show();
            this.$('.query-results-count').empty();

            table.empty();
            this.query.get('countonly') || table.append(this.renderHeader());

            var view = new ScrollResults({
                View: Results,
                el: table,
                viewOptions: {fieldUIs: this.fieldUIs.slice(), model: this.model},
                fetch: this.fetchResults()
            }).render()
                .on('fetching', function() { this.$('.fetching-more').show(); }, this)
                .on('gotdata', function() { this.$('.fetching-more').hide(); }, this);

            view.fetchMoreWhileAppropriate();
        },
        fetchResults: function() {
            var query = this.query.toJSON();
            return function(offset) {
                query.offset = offset;
                return $.post('/stored_query/ephemeral/', JSON.stringify(query));
            };
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
        app.router.route('query/:id/', 'storedQuery', function(id) {
            (function showView() {
                var query = new schema.models.SpQuery.Resource({ id: id });
                query.fetch().fail(app.handleError).done(function() {
                    var view = new QueryBuilder({ query: query });
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

            var view = new QueryBuilder({ query: query });
            view.on('redisplay', function() { navigation.go('/query/' + query.id + '/'); });
            app.setCurrentView(view);
        });
    };
});
