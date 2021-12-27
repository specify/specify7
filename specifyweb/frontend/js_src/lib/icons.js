"use strict";

import $ from 'jquery';
import _ from 'underscore';
import * as initialContext from './initialcontext';

var iconGroups = {};
initialContext.loadResource('icons_datamodel.xml', data => iconGroups.datamodel = data);
initialContext.loadResource('icons_disciplines.xml', data => iconGroups.discipline = data);
initialContext.loadResource('icons_imgproc.xml', data => iconGroups.imgproc = data);
initialContext.loadResource('icons_plugins.xml', data => iconGroups.plugin = data);
initialContext.loadResource('icons.xml', data => iconGroups.default = data);

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

        export function getIcon(icon) {
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

