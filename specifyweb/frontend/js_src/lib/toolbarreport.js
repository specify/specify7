"use strict";

import reports from './reports';
import * as initialContext from './initialcontext';
import commonText from './localization/common';

    initialContext.load('report_runner_status.json', status => reports.disable = !status.available);

    export default {
        task: 'report',
        title: commonText('reports'),
        icon: '/static/img/report_icon.png',
        disabled: undefined,
        execute: reports
    };

