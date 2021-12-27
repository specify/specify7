"use strict";

import _ from 'underscore';

import * as initialContext from './initialcontext';
import { getProperty } from './props';


    var locale = 'en';
    var bundles = {};
    ['resources', 'views', 'global_views', 'expresssearch'].map(function(bundle) {
        initialContext.loadProperties(bundle + '_' + locale + '.properties', data => bundles[bundle] = data);
    });

    export function localize(s, fallback) {
        var keys = Object.keys(bundles);
        for (var k = 0; k < keys.length; k++) {
            var localized = getProperty(bundles[keys[k]], s);
            if (localized) return localized;
        }
        return fallback || s;
    }
    export function localizeFrom(from, s, fallback) {
        const fromList = _.isString(from) ? [from] : from;
        for(let from of fromList) {
            let localized = getProperty(bundles[from], s);
            if (localized) return localized;
        }
        return fallback || s;
    }

