define([
    'jquery', 'underscore',
    'text!context/viewsets/0.xml!noinline',
    'text!context/viewsets/1.xml!noinline',
    'text!context/viewsets/2.xml!noinline',
    'text!context/viewsets/3.xml!noinline',
    'text!context/viewsets/4.xml!noinline',
    'text!context/viewsets/5.xml!noinline',
], function parseViewSets($, _) {
    "use strict";

    var viewsets = _.chain(arguments).tail(parseViewSets.length).map(function(xml) {
        return _.toArray($($.parseXML(xml)).find('viewset'));
    }).flatten().value();

    function find(selector, sets, name) {
        name = name.toLowerCase();
        var result = $();
        _.find(sets, function(set) {
            result = $(selector, set).filter(function() {
                return $(this).attr('name').toLowerCase() === name;
            });
            return result.length;
        });
        return result;
    }

    return {
        findView: _.bind(find, this, 'view', viewsets),
        findViewdef: _.bind(find, this, 'viewdef', viewsets)
    };
});
