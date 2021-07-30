"use strict";

import * as navigation from './navigation';
import * as attachments from './attachments';

import commonText from './localization/common';

export default {
        task: 'attachments',
        title: commonText('attachments'),
        icon: '/static/img/attachment_icon.png',
        disabled: function() { return !attachments.systemAvailable(); },
        execute: function() {
            navigation.go('/specify/attachments/');
        }
    };

