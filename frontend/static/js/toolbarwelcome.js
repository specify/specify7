define(['navigation'], function(navigation) {
    "use strict";

    return {
        title: 'Welcome',
        icon: '/images/specify32.png',
        execute: function() {
            navigation.go('/specify/');
        }
    };
});