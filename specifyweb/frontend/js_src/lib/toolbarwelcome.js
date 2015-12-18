var navigation       = require('./navigation');

module.exports = {
        task: 'welcome',
        title: 'Welcome',
        icon: '/static/img/specify_7_webapp.png',
        execute: function() {
            navigation.go('/specify/');
        }
    };
