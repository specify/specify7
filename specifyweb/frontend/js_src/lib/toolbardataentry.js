var navigation  = require('./navigation');
var FormsDialog = require('./formsdialog.js');

const commonText = require('./localization/common.tsx').default;


module.exports = {
        task: 'data',
        title: commonText('dataEntry'),
        icon: '/static/img/data entry.png',
        execute: function() {
            new FormsDialog().render().on('selected', function(model) {
                navigation.go(new model.Resource().viewUrl());
            });
        }
    };

