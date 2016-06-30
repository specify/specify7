"use strict";

var navigation         = require('./navigation.js');
var InteractionsDialog = require('./interactionsdialog.js');


module.exports = {
    task: 'interactions',
    title: 'Interactions',
    disabled(userInfo) {
        return !userInfo.available_tasks.includes('Interactions');
    },
    icon: '/static/img/interactions.png',
    execute: function() {
        new InteractionsDialog().render().on('selected', function(model) {
            navigation.go(new model.Resource().viewUrl());
        });
    }
};

