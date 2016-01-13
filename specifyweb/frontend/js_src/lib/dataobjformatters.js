"use strict";

var $ = require('jquery');
var _ = require('underscore');

var whenAll        = require('./whenall.js');
var fieldformat    = require('./fieldformat.js');
var assert         = require('./assert.js');
var initialContext = require('./initialcontext.js');

    var formatters;
    initialContext.load('app.resource?name=DataObjFormatters', data => formatters = data);

    function dataobjformat(resource, formatter) {
        if (!resource) return $.when(null);
        return resource.fetchIfNotPopulated().pipe(function() {
            formatter = formatter || resource.specifyModel.getFormat();
            var formatterDef = formatter ? $('format[name="' + formatter + '"]', formatters) :
                    $('format[class="' + resource.specifyModel.longName + '"]', formatters);

            var sw = formatterDef.find('switch');
            // external dataobjFormatters not supported
            if (!sw.length || sw.find('external').length) return null;

            // doesn't support switch fields that are in child objects
            var fields = (sw.attr('field') && (sw.attr('single') !== 'true') ?
                          sw.find('fields[value="' + resource.get(sw.attr('field')) + '"]:first') :
                          sw.find('fields:first')).find('field');

            var deferreds = fields.map(function () {
                var fieldNode = $(this);
                var formatter = fieldNode.attr('formatter'); // hope it's not circular!
                var fieldName = fieldNode.text();
                return resource.rget(fieldName).pipe(function(value) {
                    return formatter ? dataobjformat(value, formatter) :
                        fieldformat(resource.specifyModel.getField(fieldName), value);
                });
            });

            return whenAll(deferreds).pipe(function (fieldVals) {
                var result = [];
                fields.each(function (index) {
                    if (!fieldVals[index]) return;
                    var fieldNode = $(this);
                    fieldNode.attr('sep') && result.push(fieldNode.attr('sep'));

                    var format = fieldNode.attr('format');
                    if (!_(format).isUndefined() && format.trim() === '') return;
                    result.push(fieldVals[index]);
                });
                return result.join('');
            });
        });
    }

    function aggregate(collection) {
        var aggregatorName = collection.model.specifyModel.getAggregator();
        var aggregator = aggregatorName ? $('aggregator[name="' + aggregatorName + '"]', formatters) :
                $('aggregator[class="' + collection.model.specifyModel.longName + '"]', formatters);

        var format = aggregator.attr('format');
        var separator = aggregator.attr('separator');

        assert(collection.isComplete());

        var formatting = collection.map(function(resource) {
            return dataobjformat(resource, format);
        });

        return whenAll(formatting).pipe(function(formatted) {
            return formatted.join(separator);
        });
    }

module.exports = { format: dataobjformat, aggregate: aggregate };

