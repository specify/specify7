define([
'jquery', 'underscore', 'backbone', 'navigation', 'cs!appresource', 'schema',
'specifyapi', 'cs!fieldformat', 'cs!props', 'scrollresults', 'whenall',
'text!context/available_related_searches.json!noinline',
'text!properties/expresssearch_en.properties!noinline',
'jquery-bbq', 'jquery-ui'
], function($, _, Backbone, navigation, getAppResource, schema,
            api, fieldformat, props, ScrollResults, whenAll,
            availableRelatedJson, propstext) {
    "use strict";

    function capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    }

    var configFetch = getAppResource('ExpressSearchConfig');
    var relatedSearches = $.parseJSON(availableRelatedJson);
    var getProp = _.bind(props.getProperty, props, propstext);
    var accordionOptions = {
        autoHeight: false,
        collapsible: true,
        active: false
    };

    var PrimaryResults = Backbone.View.extend({
        initialize: function(options) {
            this.searchTable = options.searchTable;
            this.data = options.data;
            this.model = options.model;
            this.displayFields = _.chain($('displayfield', this.searchTable))
                .sortBy(function(df) {return parseInt($('order', df).text(), 10);})
                .map(function(df) {return this.model.getField($('fieldName', df).text());}, this)
                .value();
        },
        resultsFromData: function(data) {
            return _.first( _.values(data) ).results;
        },
        getLastID: function() {
            return this.lastID;
        },
        addResults: function(results) {
            _.each(results, function(result) {
                var row = $('<tr>').appendTo(this.$('table'));
                _.each(this.displayFields, function(field) {
                    var resource = new (api.Resource.forModel(this.model))({id: result.id});
                    var href = resource.viewUrl();
                    var value = fieldformat(field, result[field.name.toLowerCase()]);
                    row.append($('<td>').append($('<a>', {
                        href: href,
                        "class": "express-search-result"
                    }).text(value)));
                }, this);
            }, this);
            this.lastID =  _.last(results).id;
        },
        render: function() {
            var table = $('<table width="100%">').appendTo(this.el);

            var header = $('<tr>').appendTo(table);
            _.each(this.displayFields, function(displayField) {
                header.append($('<th>').text(displayField.getLocalizedName()));
            });

            this.addResults(this.data.results);
            return this;
        }
    });

    var RelatedResults = Backbone.View.extend({
        initialize: function(options) {
            this.relatedSearch = options.data;
            this.model = schema.getModel(this.relatedSearch.definition.root);
            this.displayFields = _.map(this.relatedSearch.definition.columns, this.model.getField, this.model);
        },
        addResults: function(results) {
            var table = this.$('table');
            _.each(results, function(values) {
                var row = $('<tr>').appendTo(table);
                var resource = new (api.Resource.forModel(this.model))({id: _.last(values)});
                var href = resource.viewUrl();
                _.each(this.displayFields, function(field, i) {
                    var value = fieldformat(field, values[i]);
                    row.append($('<td>').append($('<a>', {
                        href: href,
                        "class": "express-search-result"
                    }).text(value)));
                });
            }, this);
            this.lastID =  _.last( _.last(results) );
        },
        resultsFromData: function(data) {
            return data.results;
        },
        getLastID: function(results) {
            return this.lastID;
        },
        render: function() {
            var table = $('<table width="100%">').appendTo(this.el);
            var header = $('<tr>').appendTo(table);
            _.each(this.displayFields, function(field) {
                return header.append($('<th>').text(field.getLocalizedName()));
            });
            this.addResults(this.relatedSearch.results);
            return this;
        }
    });

    return {
        SearchView: Backbone.View.extend({
            events: {
                'click :submit': 'search'
            },
            search: function(evt) {
                var query, url;
                evt.preventDefault();
                query = this.$('.express-search-query').val().trim();
                if (query) {
                    url = $.param.querystring('/specify/express_search/', {q: query});
                    navigation.go(url);
                }
            }
        }),

        ResultsView: Backbone.View.extend({
            events: {
                'click a.express-search-result': 'navToResult',
                'accordionchange': 'panelOpened'
            },
            render: function() {
                this.$el.append('<h3>Primary Search</h3><p class="status primary">Running...</p><div class="results primary"></div>');
                this.$el.append('<h3>Secondary Search</h3><p class="status related">Running...</p><div class="results related"></div>');
                this.$('.results').accordion(accordionOptions);
                var query = $.deparam.querystring().q;
                $('.express-search-query').val(query);
                this.ajaxUrl = $.param.querystring('/express_search/', {q: query});
                $.get(this.ajaxUrl, _.bind(this.showResults, this));
                this.doRelatedSearches(query);
                return this;
            },
            searchTableOrder: function(searchTable) {
                return parseInt($('displayOrder', searchTable).text(), 10);
            },
            showResults: function(data) {
                var _this = this;
                var showResults = _.bind(this.showResultsForTable, this, data);
                configFetch.done(function(config) {
                    var totalResults = _.chain($('tables > searchtable', config))
                            .sortBy(_this.searchTableOrder)
                            .map(showResults)
                            .reduce((function(a, b) {return a + b;}), 0);

                    if (totalResults.value() === 0) {
                        _this.$('.primary.status').text('No Matches');
                    } else {
                        _this.$('.primary.status').hide();
                    }
                    _this.$('.results.primary').accordion('destroy').accordion(accordionOptions);
                });
            },
            doRelatedSearches: function(query) {
                var _this = this;
                var deferreds = _.map(relatedSearches, function(rs) {
                    var ajaxUrl = $.param.querystring('/express_search/related/', {q: query, name: rs});
                    var showResults = _.bind(_this.showRelatedResults, _this, ajaxUrl);
                    return $.get(ajaxUrl).pipe(showResults);
                });
                whenAll(deferreds).then(function(counts) {
                    if (_.reduce(counts, (function(a, b) {return a + b;}), 0) === 0) {
                        return _this.$('.related.status').text('No Matches');
                    } else {
                        return _this.$('.related.status').hide();
                    }
                });
            },
            showRelatedResults: function(ajaxUrl, data) {
                if (data.totalCount < 1) return 0;
                var results = new ScrollResults({View: RelatedResults, viewOptions: {data: data}, ajaxUrl: ajaxUrl});
                var rsName = data.definition.name;
                var heading = (getProp(rsName) || rsName) + ' - ' + data.totalCount;
                this.$('.related.results').append($('<h4>').append($('<a>').text(heading)));
                results.render().$el.appendTo(this.$('.related.results'));
                this.$('.results.related').accordion('destroy').accordion(accordionOptions);
                return data.totalCount;
            },
            showResultsForTable: function(data, searchTable) {
                var tableName = capitalize($('tableName', searchTable).text());
                data = data[tableName];
                if (data.results.length < 1) return 0;
                var model = schema.getModel(tableName);
                var heading = model.getLocalizedName() + ' - ' + data.totalCount;
                this.$('.primary.results').append($('<h4>').append($('<a>').text(heading)));

                var results = new ScrollResults({
                    View: PrimaryResults,
                    viewOptions: {data: data, model: model, searchTable: searchTable},
                    ajaxUrl: $.param.querystring(this.ajaxUrl, {name: capitalize(model.name)})
                });
                results.render().$el.appendTo(this.$('.primary.results'));
                return data.totalCount;
            },
            panelOpened: function(evt, ui) {
                var resultsView = ui.newContent.data('view');
                resultsView && resultsView.fetchMoreWhileAppropriate();
            },
            navToResult: function(evt) {
                evt.preventDefault();
                return navigation.go($(evt.currentTarget).prop('href'));
            }
        })
    };
});

