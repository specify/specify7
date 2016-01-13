"use strict";

var navigation = require('./navigation.js');
var attachments = require('./attachments.js');

module.exports =  {
        task: 'attachments',
        title: 'Attachments',
        icon: '/images/attach_pref.png',
        disabled: function() { return !attachments.systemAvailable(); },
        execute: function() {
            navigation.go('/specify/attachments/');
        }
    };

