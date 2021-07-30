import * as navigation from './navigation';
import FormsDialog from './formsdialog';

import commonText from './localization/common';


export default {
        task: 'data',
        title: commonText('dataEntry'),
        icon: '/static/img/data entry.png',
        execute: function() {
            new FormsDialog().render().on('selected', function(model) {
                navigation.go(new model.Resource().viewUrl());
            });
        }
    };

