var navigation  = require('./navigation');
var FormsDialog = require('./formsdialog.js');

module.exports = {
        task: 'data',
        title: 'Data Entry',
        icon: '/static/img/data entry.png',
        execute: function() {
            new FormsDialog().render().on('selected', function(model) {
                navigation.go(new model.Resource().viewUrl());
            });
        }
    };

