define(['navigation', 'interactionsdialog'], function(navigation, InteractionsDialog) {
    "use strict";

    return {
        task: 'interactions',
        title: 'Interactions',
        icon: '/images/interactions.png',
        execute: function() {
            new InteractionsDialog().render().on('selected', function(model) {
                navigation.go(new model.Resource().viewUrl());
            });
        }
    };
});
