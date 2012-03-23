define([
    'jquery',
    'text!/static/resources/icons_datamodel.xml'
], function($, xmlText) {
    "use strict";
    var self = {}, xml = $.parseXML(xmlText);

    self.getIcon = function (icon, cycleDetect) {
        var iconNode = $('icon[name="' + icon + '"]', xml);
        cycleDetect = cycleDetect || {};
        if (cycleDetect[icon]) return 'circular_reference_in_icons';
        if (iconNode.attr('alias')) {
            cycleDetect[icon] = true;
            return self.getIcon(iconNode.attr('alias'), cycleDetect);
        }
        return '/static/img/icons/datamodel/' + iconNode.attr('file');
    };

    return self;
});
