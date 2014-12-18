define(['navigation'], function(navigation) {
    "use strict";

    return {
        task: 'welcome',
        title: 'Welcome',
        icon: '/static/img/specify_7_webapp.png',
        execute: function() {
            navigation.go('/specify/');
        }
    };
});
