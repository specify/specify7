define([
    'jquery', 'underscore',
    'text!/static/resources/system.views.xml',
    'text!/static/resources/editorpanel.views.xml',
    'text!/static/resources/preferences.views.xml',
    'text!/static/resources/search.views.xml',
    'text!/static/resources/global.views.xml',
    'text!/static/resources/common.views.xml',
    'text!/static/resources/fish.views.xml'
], function parseViewSets($, _) {
    "use strict";
    var viewsets = _.chain(arguments).tail(parseViewSets.length).map($.parseXML).value().reverse();

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
