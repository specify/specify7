"use strict";

import remoteprefs from './remoteprefs';

var dateFormat;

export default function() {
    if (dateFormat == null) {
        dateFormat = typeof remoteprefs['ui.formatting.scrdateformat'] === 'string' ?
            remoteprefs['ui.formatting.scrdateformat'].toUpperCase() : 'YYYY-MM-DD';
    }
    return dateFormat;
};
