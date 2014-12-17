define(['navigation', 'formsdialog'], function(navigation, FormsDialog) {
    "use strict";

    return {
        task: 'data',
        title: 'Data',
        icon: '/images/Data_Entry.png',
        execute: function() {
            new FormsDialog().render().on('selected', function(model) {
                navigation.go(new model.Resource().viewUrl());
            });
        }
    };
});
