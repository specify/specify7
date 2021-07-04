"use strict";

var reports        = require('./reports.js');
var initialContext = require('./initialcontext.js');
const commonText = require('./localization/common').default;

    initialContext.load('report_runner_status.json', status => reports.disable = !status.available);

    var reportsToolbarItem = {
        task: 'report',
        title: commonText('reports'),
        icon: '/static/img/report_icon.png',
        disabled: undefined,
        execute: reports
    };

module.exports =  reportsToolbarItem;

