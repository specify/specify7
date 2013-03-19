define([
'jquery', 'underscore', 'backbone', 'navigation', 'cs!appresource', 'schema',
'specifyapi', 'cs!fieldformat', 'cs!props', 'whenall',
'text!context/available_related_searches.json!noinline',
'text!properties/expresssearch_en.properties!noinline',
'jquery-bbq', 'jquery-ui'
], function($, _, Backbone, navigation, getAppResource, schema,
            api, fieldformat, props, whenAll,
            availableRelatedJson, propstext) {
    "use strict";

    var configFetch = getAppResource('ExpressSearchConfig');
    var relatedSearches = $.parseJSON(availableRelatedJson);
    var getProp = _.bind(props.getProperty, props, propstext);
    var accordionOptions = {
        autoHeight: false,
        collapsible: true,
        active: false
    };

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
                'click a.express-search-result': 'navToResult'
            },
            render: function() {
                this.$el.append('<h3>Primary Search</h3><p class="status primary">Running...</p><div class="results primary"></div>');
                this.$el.append('<h3>Secondary Search</h3><p class="status related">Running...</p><div class="results related"></div>');
                this.$('.results').accordion(accordionOptions);
                var query = $.deparam.querystring().q;
                $('.express-search-query').val(query);
                var ajaxUrl = $.param.querystring('/express_search/', {q: query});
                $.get(ajaxUrl, _.bind(this.showResults, this));
                this.doRelatedSearches(query);
                return this;
            },
            searchTableOrder: function(searchTable) {
                return parseInt($('displayOrder', searchTable).text(), 10);
            },
            showResults: function(results) {
                var _this = this;
                var showResults = _.bind(this.showResultsForTable, this, results);
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
                    var showResults = _.bind(_this.showRelatedResults, _this);
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
            showRelatedResults: function(relatedSearch) {
                if (relatedSearch.totalCount < 1) return 0;
                var rsName = relatedSearch.definition.name;
                var heading = (getProp(rsName) || rsName) + ' - ' + relatedSearch.totalCount;
                this.$('.related.results').append($('<h4>').append($('<a>').text(heading)));
                var div = $('<div>').appendTo(this.$('.related.results'));
                var table = $('<table width="100%">').appendTo(div);
                div.scroll(function() {
                    return console.log(table.height() - div.scrollTop() - div.height());
                });
                var model = schema.getModel(relatedSearch.definition.root);
                var displayFields = _.map(relatedSearch.definition.columns, _.bind(model.getField, model));
                var header = $('<tr>').appendTo(table);
                _.each(displayFields, function(field) {
                    return header.append($('<th>').text(field.getLocalizedName()));
                });
                _.each(relatedSearch.results, function(values) {
                    var href, resource, row;
                    row = $('<tr>').appendTo(table);
                    resource = new (api.Resource.forModel(model))({
                        id: values.pop()
                    });
                    href = resource.viewUrl();
                    return _.each(displayFields, function(field, i) {
                        var value;
                        value = fieldformat(field, values[i]);
                        return row.append($('<td>').append($('<a>', {
                            href: href,
                            "class": "express-search-result"
                        }).text(value)));
                    });
                });
                this.$('.results.related').accordion('destroy').accordion(accordionOptions);
                return relatedSearch.totalCount;
            },
            showResultsForTable: function(allResults, searchTable) {
                var model = schema.getModel($('tableName', searchTable).text());
                var results = _.find(allResults, function(__, name) {
                    return name.toLowerCase() === model.name.toLowerCase();
                });
                if (results.length < 1) return 0;

                var heading = model.getLocalizedName() + ' - ' + results.length;
                this.$('.primary.results').append($('<h4>').append($('<a>').text(heading)));

                var table = $('<table width="100%">').appendTo($('<div>').appendTo(this.$('.primary.results')));

                var displayFields = _.chain($('displayfield', searchTable))
                        .sortBy(function(df) {return parseInt($('order', df).text(), 10);})
                        .map(function(df) {return model.getField($('fieldName', df).text());})
                        .value();

                var header = $('<tr>').appendTo(table);
                _.each(displayFields, function(displayField) {
                    header.append($('<th>').text(displayField.getLocalizedName()));
                });

                _.each(results, function(result) {
                    var row = $('<tr>').appendTo(table);
                    _.each(displayFields, function(field) {
                        var resource = new (api.Resource.forModel(model))({id: result.id});
                        var href = resource.viewUrl();
                        var value = fieldformat(field, result[field.name.toLowerCase()]);
                        row.append($('<td>').append($('<a>', {
                            href: href,
                            "class": "express-search-result"
                        }).text(value)));
                    });
                });
                return results.length;
            },
            navToResult: function(evt) {
                evt.preventDefault();
                return navigation.go($(evt.currentTarget).prop('href'));
            }
        })
    };
});

