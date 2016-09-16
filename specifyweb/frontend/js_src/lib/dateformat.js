"use strict";

const remoteprefs = require('./remoteprefs.js');

var dateFormat;

module.exports = function() {
    if (dateFormat == null) {
        dateFormat = typeof remoteprefs['ui.formatting.scrdateformat'] === 'string' ?
            remoteprefs['ui.formatting.scrdateformat'].toUpperCase() : 'YYYY-MM-DD';
    }
    return dateFormat;
};
