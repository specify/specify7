"use strict";

var $         = require('jquery');
var _         = require('underscore');
var Backbone  = require('./backbone.js');

var schema            = require('./schema.js');
var QueryResultsTable = require('./queryresultstable.js');
var router            = require('./router.js');
var QueryFieldSpec    = require('./queryfieldspec.js');
var whenAll           = require('./whenall.js');
var s                 = require('./stringlocalization.js');
var initialContext    = require('./initialcontext.js');
var app               = require('./specifyapp.js');
var querystring       = require('./querystring.js');


    var relatedSearches;
    initialContext.load('available_related_searches.json', data => relatedSearches = data);

    var accordionOptions = {
        autoHeight: false,
        collapsible: true,
        active: false
    };

    var makeFS = function(fs) { return QueryFieldSpec.fromStringId(fs.stringId, fs.isRelationship); };

    var ResultsView = Backbone.View.extend({
        __name__: "ResultsView",
        events: {
            'accordionchange': 'panelOpened'
        },
        render: function() {
            this.$el.append('<h3>Primary Search</h3><p class="status primary">Running...</p><div class="results primary"></div>');
            this.$el.append('<h3>Secondary Search</h3><p class="status related">Running...</p><div class="results related"></div>');
            this.$('.results').accordion(accordionOptions);
            var query = querystring.deparam().q;
            $('.express-search-query').val(query);

            this.doPrimarySearch(query);
            this.doRelatedSearches(query);
            return this;
        },
        doPrimarySearch: function(query) {
            var ajaxUrl = querystring.param('/express_search/', {q: query});
            $.get(ajaxUrl, _.bind(this.showPrimaryResults, this, ajaxUrl));
        },
        showPrimaryResults: function(ajaxUrl, allTablesResults) {
            _.each(allTablesResults, _.bind(this.makePrimaryResultView, this, ajaxUrl));

            var counts = _.pluck(allTablesResults, 'totalCount');
            var totalCount = _.reduce(counts, (function(a, b) {return a + b;}), 0);

            var statusEl = this.$('.primary.status');
            totalCount < 1 ? statusEl.text('No Matches') : statusEl.hide();
            this.$('.results.primary').accordion('destroy')
                .accordion(_.extend({}, accordionOptions, {active:0}));
        },
        makePrimaryResultView: function(ajaxUrl, results, tableName) {
            if (results.totalCount < 1) return;
            var model = schema.getModel(tableName);
            var heading = model.getLocalizedName() + ' - ' + results.totalCount;
            this.$('.primary.results').append($('<h4>').append($('<a>').text(heading)));

            new QueryResultsTable({
                noHeader: true,
                model: model,
                fieldSpecs: _.map(results.fieldSpecs, makeFS),
                format: true,
                initialData: results,
                fetchResults: function(offset) {
                    var url = querystring.param(ajaxUrl, {name: model.name, offset: offset});
                    return $.get(url).pipe(function(data) { return data[model.name]; });
                }
            }).render().$el.appendTo(this.$('.primary.results'));
        },
        doRelatedSearches: function(query) {
            var statusEl = this.$('.related.status');

            var deferreds = _.map(relatedSearches, function(rs) {
                var ajaxUrl = querystring.param('/express_search/related/', {q: query, name: rs});
                var showResults = _.bind(this.showRelatedResults, this, ajaxUrl);
                return $.get(ajaxUrl).pipe(showResults);
            }, this);

            whenAll(deferreds).then(function(counts) {
                var totalCount = _.reduce(counts, (function(a, b) {return a + b;}), 0);
                totalCount < 1 ? statusEl.text('No Matches') : statusEl.hide();
            });
        },
        showRelatedResults: function(ajaxUrl, data) {
            if (data.totalCount < 1) return 0;
            var fieldSpecs = _.map(data.definition.fieldSpecs, makeFS);
            var model = schema.getModel(data.definition.root);
            var linkField = 0;
            if (data.definition.link) {
                var linkFieldSpec = fieldSpecs.pop();
                linkField = fieldSpecs.length + 1;
                model = _.last(linkFieldSpec.joinPath).getRelatedModel();
            }

            var results = new QueryResultsTable({
                noHeader: true,
                model: model,
                fieldSpecs: fieldSpecs,
                linkField: linkField,
                initialData: data,
                ajaxUrl: ajaxUrl
            });
            var rsName = data.definition.name;
            var heading = $('<h4>')
                    .append($('<a>').text(s.localizeFrom('expresssearch', rsName) + ' - ' + data.totalCount))
                    .attr('title', s.localizeFrom('expresssearch', rsName + "_desc"));
            this.$('.related.results').append(heading);
            results.render().$el.appendTo(this.$('.related.results'));
            this.$('.results.related').accordion('destroy').accordion(accordionOptions);
            return data.totalCount;
        },
        panelOpened: function(evt, ui) {
            var resultsView = ui.newContent.data('view');
            resultsView && resultsView.fetchMoreWhileAppropriate();
        }
    });

module.exports =  function() {
        router.route('express_search/', 'esearch', function() {
            app.setCurrentView(new ResultsView());
            app.setTitle('Express Search');
        });
    };

