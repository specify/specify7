define([
    'reports', 'initialcontext',
], function(reports, initialContext) {
    "use strict";

    initialContext.load('report_runner_status.json', status => reports.disable = !status.available);

    var reportsToolbarItem = {
        task: 'report',
        title: "Reports",
        icon: '/images/Reports32x32.png',
        disabled: undefined,
        execute: reports
    };

    return reportsToolbarItem;
});
