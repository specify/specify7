define([
    'jquery', 'underscore',
    'text!resources/icons_datamodel.xml!noinline',
    'text!resources/icons_disciplines.xml!noinline',
    'text!resources/icons_imgproc.xml!noinline',
    'text!resources/icons_plugins.xml!noinline',
    'text!resources/icons.xml!noinline'
], function ($, _,
             datamodelIcons,
             disciplineIcons,
             imgprocIcons,
             pluginIcons,
             defaultIcons) {
    "use strict";
    var iconGroups = {
        datamodel: $.parseXML(datamodelIcons),
        discipline: $.parseXML(disciplineIcons),
        imgproc: $.parseXML(imgprocIcons),
        plugin: $.parseXML(pluginIcons),
        default: $.parseXML(defaultIcons)
    };

    var iconDirs = {
        datamodel: '/images/datamodel/',
        discipline: '/images/discipline/',
        imgproc: '/images/imgproc/',
        plugin: '/images/',
        default: '/images/'
    };

    function findIconInXML(icon, xml, cycleDetect) {
        var iconNode = $('icon[name="' + icon + '"]', xml);
        cycleDetect = cycleDetect || {};
        if (cycleDetect[icon]) throw new Error('circular_reference_in_icons');
        if (iconNode.attr('alias')) {
            cycleDetect[icon] = true;
            return findIconInXML(iconNode.attr('alias'), xml, cycleDetect);
        }
        return iconNode;
    }

    return {
        getIcon: function (icon) {
            var group, iconFile;
            _.find(iconGroups, function(xml, name) {
                var iconNode = findIconInXML(icon, xml);
                if (iconNode.length) {
                    group = name;
                    iconFile = iconNode.attr('file');
                    return true;
                }
                return false;
            });

            if (group) {
                return iconDirs[group] + iconFile;
            } else {
                return '/images/unknown.png';
            }
        }
    };
});
