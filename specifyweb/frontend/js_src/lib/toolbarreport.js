"use strict";

var reports        = require('./reports.js');
var initialContext = require('./initialcontext.js');

    initialContext.load('report_runner_status.json', status => reports.disable = !status.available);

    var reportsToolbarItem = {
        task: 'report',
        title: "Reports",
        icon: '/static/img/report_icon.png',
        disabled: undefined,
        execute: reports
    };

module.exports =  reportsToolbarItem;

