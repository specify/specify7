"use strict";

var navigation = require('./navigation.js');
var attachments = require('./attachments.js');

module.exports =  {
    task: 'attachments',
    title: 'Attachments',
    icon: '/static/img/attachment_icon.png',
    disabled: function(userInfo) {
        return !attachments.systemAvailable() || !userInfo.available_tasks.includes('ATTACHMENTS');
    },
    execute: function() {
        navigation.go('/specify/attachments/');
    }
};

