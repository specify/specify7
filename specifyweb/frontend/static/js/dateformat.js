"use strict";

var remoteprefs = require('./remoteprefs.js');

module.exports =  typeof remoteprefs['ui.formatting.scrdateformat'] === 'string'
                ? remoteprefs['ui.formatting.scrdateformat'].toUpperCase()
                : 'YYYY-MM-DD';
