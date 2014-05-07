define([
    'jquery', 'underscore', 'backbone', 'templates',
    'scrollresults', 'queryresults',
    'jquery-bbq', 'jquery-ui'
], function($, _, Backbone, templates, ScrollResults, QueryResults) {
    "use strict";

    function renderHeader(fieldSpec) {
        var field = _.last(fieldSpec.joinPath);
        var icon = field.model.getIcon();
        var name = fieldSpec.treeRank || field.getLocalizedName();
        if (fieldSpec.datePart &&  fieldSpec.datePart != 'Full Date') {
            name += ' (' + fieldSpec.datePart + ')';
        }
        return $('<th>').text(name).prepend($('<img>', {src: icon}));
    }

    var QueryResultsTable = Backbone.View.extend({
        __name__: "QueryResultsTable",
        className: "query-results-table",
        initialize: function(options) {
            this.countOnly = options.countOnly;
            this.fieldSpecs = options.fieldSpecs;
            this.fetchResults = options.fetchResults;
        },
        renderHeader: function() {
            var header = $('<tr>');
            _.each(this.fieldSpecs, function(f) { header.append(renderHeader(f)); });
            return $('<thead>').append(header);
        },
        render: function() {
            this.$el.append(templates.queryresults());
            var table = this.$('table.query-results');
            this.$('.query-results-count').empty();
            this.countOnly || table.append(this.renderHeader());

            var results = this.results = new ScrollResults({
                View: QueryResults,
                el: table,
                fetch: this.fetchResults,
                viewOptions: {
                    model: this.model,
                    fieldSpecs: this.fieldSpecs
                }
            }).render()
                .on('fetching', function() { this.$('.fetching-more').show(); }, this)
                .on('gotdata', function() { this.$('.fetching-more').hide(); }, this);

            _.defer(function() {
                results.fetchMoreWhileAppropriate();
            });
            return this;
        },
        remove: function() {
            this.results && this.results.undelegateEvents();
            return Backbone.View.prototype.remove.apply(this, arguments);
        }
    });

    return QueryResultsTable;
});
