"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';

import ajax from './ajax';
import schema from './schema';
import QueryResultsTable from './queryresultstable';
import router from './router';
import QueryFieldSpec from './queryfieldspec';
import whenAll from './whenall';
import * as s from './stringlocalization';
import initialContext from './initialcontext';
import * as app from './specifyapp';
import * as querystring from './querystring';
import commonText from './localization/common';


    const relatedSearchesPromise = ajax(
      '/context/available_related_searches.json',
        {headers: {Accept: 'application/json'}}
    ).then(({data})=>data);

    var accordionOptions = {
        autoHeight: false,
        collapsible: true,
        active: false
    };

    var makeFS = function(fs) { return QueryFieldSpec.fromStringId(fs.stringId, fs.isRelationship); };

    var ResultsView = Backbone.View.extend({
        __name__: "ResultsView",
        className: "express-search-view",
        title: commonText('expressSearch'),
        events: {
            'accordionchange': 'panelOpened'
        },
        render: function() {
            this.$el.append(`
                <h3>${commonText('primarySearch')}</h3>
                <p class="status primary">${commonText('running')}</p>
                <div class="results primary" aria-live="polite"></div>
            `);
            this.$el.append(`
                <h3>${commonText('secondarySearch')}</h3>
                <p class="status related">${commonText('running')}</p>
                <div class="results related" aria-live="polite"></div>
            `);
            this.$('.results').accordion(accordionOptions);
            var query = querystring.deparam().q;
            $('.express-search-query').val(query);

            this.doPrimarySearch(query);
            relatedSearchesPromise.then(relatedSearches=>
              this.doRelatedSearches(relatedSearches, query)
            );
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
            this.$('.primary.results').append($('<h4>').append($('<button>',{type:'button',class:'fake-link'}).text(heading)));

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
        doRelatedSearches: function(relatedSearches, query) {
            var statusEl = this.$('.related.status');

            var deferreds = _.map(relatedSearches, function(rs) {
                var ajaxUrl = querystring.param('/express_search/related/', {q: query, name: rs});
                var showResults = _.bind(this.showRelatedResults, this, ajaxUrl);
                return $.get(ajaxUrl).pipe(showResults);
            }, this);

            whenAll(deferreds).then(function(counts) {
                var totalCount = _.reduce(counts, (function(a, b) {return a + b;}), 0);
                totalCount < 1 ? statusEl.text(commonText('noMatches')) : statusEl.hide();
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
                    .append($('<button>',{type:'button', class:'fake-link'}).text(s.localizeFrom('expresssearch', rsName) + ' - ' + data.totalCount))
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

export default function() {
        router.route('express_search/', 'esearch', function() {
            app.setCurrentView(new ResultsView());
        });
    };
