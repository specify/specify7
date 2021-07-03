"use strict";

var navigation         = require('./navigation.js');
var InteractionsDialog = require('./interactionsdialog.js');
const commonText = require('./localization/common.tsx').default;


module.exports = {
        task: 'interactions',
        title: commonText('interactions'),
        icon: '/static/img/interactions.png',
        execute: function() {
            new InteractionsDialog().render().on('selected', function(model) {
                navigation.go(new model.Resource().viewUrl());
            });
        }
    };

