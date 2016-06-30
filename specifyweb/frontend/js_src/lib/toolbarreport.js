"use strict";

var reports        = require('./reports.js');
var initialContext = require('./initialcontext.js');

initialContext.load('report_runner_status.json', status => reports.disable = !status.available);

var reportsToolbarItem = {
    task: 'report',
    title: "Reports",
    disabled(userInfo) {
        return !userInfo.available_tasks.includes('Reports') &&
            !userInfo.available_tasks.includes('Labels');
    },
    icon: '/static/img/report_icon.png',
    execute: reports
};

module.exports =  reportsToolbarItem;

