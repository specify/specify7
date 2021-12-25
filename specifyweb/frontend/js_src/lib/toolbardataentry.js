var navigation  = require('./navigation');
var FormsDialog = require('./formsdialog.js');

const commonText = require('./localization/common').default;


module.exports = {
        task: 'data',
        title: commonText('dataEntry'),
        icon: '/static/img/data entry.png',
        path: '/specify/view',
        view: ({ onClose })=>new FormsDialog({ onClose }),
    };

