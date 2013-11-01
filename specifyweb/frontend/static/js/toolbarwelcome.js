define(['navigation'], function(navigation) {
    "use strict";

    return {
        task: 'welcome',
        title: 'Welcome',
        icon: '/images/specify32.png',
        execute: function() {
            navigation.go('/specify/');
        }
    };
});
