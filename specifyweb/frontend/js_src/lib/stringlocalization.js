"use strict";

import _ from 'underscore';

import {load} from './initialcontext';
import {getProperty} from './props';


const locale = 'en';
    const bundles = {};
    export const fetchContext = Promise.all(['resources', 'views', 'global_views', 'expresssearch'].map((bundle)=>
        load(`/properties/${bundle}_${locale}.properties`, 'text/plain').then(data => {bundles[bundle] = data})
    ));

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

