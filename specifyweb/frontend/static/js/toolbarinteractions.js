"use strict";

var navigation         = require('./navigation.js');
var InteractionsDialog = require('./interactionsdialog.js');


module.exports = {
        task: 'interactions',
        title: 'Interactions',
        icon: '/images/interactions.png',
        execute: function() {
            new InteractionsDialog().render().on('selected', function(model) {
                navigation.go(new model.Resource().viewUrl());
            });
        }
    };

