"use strict";

import $ from 'jquery';
import _ from 'underscore';

import whenAll from './whenall';
import fieldformat from './fieldformat';
import assert from './assert';
import initialContext from './initialcontext';

    var formatters;
    initialContext.load('app.resource?name=DataObjFormatters', data => formatters = data);

    export function format(resource, formatter) {
        if (!resource) return $.when(null);
        return resource.fetchIfNotPopulated().pipe(function() {
            formatter = formatter || resource.specifyModel.getFormat();
            var formatterDef = formatter ? $(`format[name="${formatter}"]`, formatters) :
                    $(`format[class="${resource.specifyModel.longName}"][default="true"]`, formatters);

            var sw = formatterDef.find('switch').first();
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
                    return formatter ? format(value, formatter) :
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

    export function aggregate(collection) {
        var aggregatorName = collection.model.specifyModel.getAggregator();
        var aggregator = aggregatorName ? $('aggregator[name="' + aggregatorName + '"]', formatters) :
                $('aggregator[class="' + collection.model.specifyModel.longName + '"]', formatters);

        var format = aggregator.attr('format');
        var separator = aggregator.attr('separator');

        assert(collection.isComplete());

        var formatting = collection.map(function(resource) {
            return format(resource, format);
        });

        return whenAll(formatting).pipe(function(formatted) {
            return formatted.join(separator);
        });
    }


export const getFormatters = ()=>Array.from(formatters.getElementsByTagName('format'));
export const getAggregators = ()=>Array.from(formatters.getElementsByTagName('aggregator'));

