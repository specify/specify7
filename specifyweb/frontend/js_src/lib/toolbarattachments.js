"use strict";

var navigation = require('./navigation.js');
var attachments = require('./attachments.js');

const commonText = require('./localization/common').default;

module.exports =  {
        task: 'attachments',
        title: commonText('attachments'),
        icon: '/static/img/attachment_icon.png',
        path: '/specify/attachments',
        disabled: function() { return !attachments.systemAvailable(); },
        execute: function() {
            navigation.go('/specify/attachments/');
        }
    };

