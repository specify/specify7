"use strict";

import $ from 'jquery';
import _ from 'underscore';

export default function(deferreds) {
        return $.when.apply($, _(deferreds).toArray()).pipe(function() { return _(arguments).toArray(); });
    };
