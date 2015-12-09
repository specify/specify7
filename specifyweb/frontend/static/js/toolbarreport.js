define([
    'jquery', 'reports',
    'text!context/report_runner_status.json!noinline'
], function($, reports, statusJSON) {
    "use strict";
    var status = $.parseJSON(statusJSON);
    var title =  "Reports";

    return {
        task: 'report',
        title: title,
        icon: '/images/Reports32x32.png',
        disabled: !status.available,
        execute: reports
    };
});
