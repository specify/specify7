define([
    'jquery', 'underscore', 'backbone'
], function($, _, Backbone) {
    "use strict";

    function renderResult(fieldSpec, rowHref, value) {
        var field = fieldSpec.getField();
        var cell = $('<a class="query-result-link">')
                .prop('href', rowHref)
                .text(value == null ? '' : value);
        return $('<td>').append(cell);
    }

    var QueryResultsView = Backbone.View.extend({
        __name__: "QueryResultsView",
        events: {
            'click .query-result-link': 'openRecord'
        },
        initialize: function(options) {
            this.fieldSpecs = options.fieldSpecs;
            this.linkField = options.linkField || 0;
            this.model = options.model;
            console.log('QueryResultsView options:', options);
        },
        detectEndOfResults: function(results) {
            $('.query-results-count').text(results.count);
            return results.results.length < 1;
        },
        addResults: function(results) {
            var table = this.$('table.query-results');
            _.each(results.results, function(result) {
                var resource = new this.model.Resource({ id: result[this.linkField] });
                var row = $('<tr class="query-result">').appendTo(table).data('resource', resource);
                var href = resource.viewUrl();
                _.each(this.fieldSpecs, function(f, i) { row.append(renderResult(f, href, result[i + 1])); });
            }, this);
            return results.results.length;
        },
        openRecord: function(evt) {
            evt.preventDefault();
            window.open($(evt.currentTarget).attr('href'));
        }
    });

    return QueryResultsView;
});
