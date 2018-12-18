"use strict";

var navigation = require('./navigation.js');
var attachments = require('./attachments/attachments.js');

module.exports =  {
        task: 'attachments',
        title: 'Attachments',
        icon: '/static/img/attachment_icon.png',
        disabled: function() { return !attachments.systemAvailable(); },
        execute: function() {
            navigation.go('/specify/attachments/');
        }
    };

