"use strict";

import $ from 'jquery';
import _ from 'underscore';
import jqueryDeparam from 'jquery-deparam';

    export function param(url, params) {
        var split = url.split('?');
        var currentParams = split[1] == null ? {} : jqueryDeparam(split[1]);
        return [split[0], $.param(_.extend(currentParams, params))].join('?');
    }
    export function deparam(url) {
        url == null && (url = window.location.href);
        var qs = url.split('?')[1];
        return qs == null ? {} : jqueryDeparam(qs);
    }
