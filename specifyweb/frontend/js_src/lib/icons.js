"use strict";

var $              = require('jquery');
var _              = require('underscore');
var initialContext = require('./initialcontext.js');

    var iconGroups = {};
    initialContext
        .loadResource('icons_datamodel.xml'      , data => iconGroups.datamodel    = data)
        .loadResource('icons_disciplines.xml'    , data => iconGroups.discipline   = data)
        .loadResource('icons_imgproc.xml'        , data => iconGroups.imgproc      = data)
        .loadResource('icons_plugins.xml'        , data => iconGroups.plugin       = data)
        .loadResource('icons.xml'                , data => iconGroups.default      = data)
    ;

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

module.exports = {
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
                console.warn("unknown icon:", icon); 
                return '/images/unknown.png';
            }
        }
    };

