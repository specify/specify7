(function (specify, $, undefined) {
    "use strict";
    if (specify.icons) return;
    var self = specify.icons = {}, $icons;

    self.getIcon = function (icon, cycleDetect) {
        var iconNode = $icons.find('icon[name="' + icon + '"]');
        cycleDetect = cycleDetect || {};
        if (cycleDetect[icon]) return 'circular_reference_in_icons';
        if (iconNode.attr('alias')) {
            cycleDetect[icon] = true;
            return self.getIcon(iconNode.attr('alias'), cycleDetect);
        }
        return '/static/img/icons/datamodel/' + iconNode.attr('file');
    };

    specify.addInitializer(function() {
        return $.get('/static/resources/icons_datamodel.xml',
                     function(data) { $icons = $(data); }).promise();
    });

} (window.specify, jQuery));
