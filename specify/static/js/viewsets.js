define([
    'jquery', 'underscore',
    'text!resources/system.views.xml',
    'text!resources/editorpanel.views.xml',
    'text!resources/preferences.views.xml',
    'text!resources/search.views.xml',
    'text!resources/global.views.xml',
    'text!resources/common.views.xml',
    'text!resources/fish.views.xml'
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
