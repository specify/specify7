define([
    'jquery', 'underscore', 'backbone', 'navigation', 'specifyform', 'populateform',
    'fieldformat', 'dataobjformatters', 'jquery-ui'
], function($, _, Backbone, navigation, specifyform, populateform, fieldformat, dataobjformatters) {
    "use strict";

    var objformat = dataobjformatters.format, aggregate = dataobjformatters.aggregate;

    function renderResult(fieldSpec, rowHref, value) {
        var field = fieldSpec.getField();
        var cell = $('<a class="query-result-link">')
                .prop('href', rowHref);

        if (!fieldSpec.treeRank && field.isRelationship) {
            (field.type === 'many-to-one') ?
                setupToOneCell(fieldSpec, cell, value) :
                setupToManyCell(fieldSpec, cell, value);
        } else {
            cell.text(formatValue(fieldSpec, value));
        }
        return $('<td>').append(cell);
    }

    function formatValue(fieldSpec, value) {
        var field = fieldSpec.getField();
        if (!field) return value;
        if (!fieldSpec.datePart || fieldSpec.datePart == 'Full Date') {
            return fieldformat(field, value);
        }
        return value;
    }

    function setupToOneCell(fieldSpec, cell, cellValue) {
        var field = fieldSpec.getField();
        if (cellValue == null) return;
        cell.text('(loading...)');
        var resource = new (field.getRelatedModel().Resource)({ id: cellValue });
        objformat(resource).done(function(formatted) { cell.text(formatted); });
    }

    function setupToManyCell(fieldSpec, cell, cellValue) {
        var field = fieldSpec.getField();
        if (cellValue == null) return;
        cell.text('(loading...)');
        var parentResource = new field.model.Resource({ id: cellValue });
        parentResource.rget(field.name, true).pipe(aggregate).done(function(formatted) {
            cell.text(formatted);
        });
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
