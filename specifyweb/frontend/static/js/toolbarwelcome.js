define(['navigation'], function(navigation) {
    "use strict";

    return {
        task: 'welcome',
        title: 'Welcome',
        icon: '/static/img/specify_welcome_small.png',
        execute: function() {
            navigation.go('/specify/');
        }
    };
});
