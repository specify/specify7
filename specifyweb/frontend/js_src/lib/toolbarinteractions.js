"use strict";

import * as navigation from './navigation';
import InteractionsDialog from './interactionsdialog';
import commonText from './localization/common';


export default {
        task: 'interactions',
        title: commonText('interactions'),
        icon: '/static/img/interactions.png',
        execute: function() {
            new InteractionsDialog().render().on('selected', function(model) {
                navigation.go(new model.Resource().viewUrl());
            });
        }
    };

