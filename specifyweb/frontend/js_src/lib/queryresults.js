"use strict";

var $         = require('jquery');
var _         = require('underscore');
var Backbone  = require('./backbone.js');

var fieldformat = require('./fieldformat.js');

    function renderResult(fieldSpec, rowHref, value, format) {
        var field = fieldSpec.getField();
        var formatted = format ? formatValue(fieldSpec, value) :
                value == null ? '' : value;
        var cell = $('<a class="query-result-link">')
                .prop('href', rowHref)
                .text(formatted);
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

    var QueryResultsView = Backbone.View.extend({
        __name__: "QueryResultsView",
        events: {
            'click .query-result-link': 'openRecord'
        },
        initialize: function(options) {
            this.format = options.format;
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
                _.each(this.fieldSpecs, function(f, i) {
                    row.append(renderResult(f, href, result[i + 1], this.format));
                }, this);
            }, this);
            return results.results.length;
        },
        openRecord: function(evt) {
            evt.preventDefault();
            window.open($(evt.currentTarget).attr('href'));
        }
    });

module.exports = QueryResultsView;

