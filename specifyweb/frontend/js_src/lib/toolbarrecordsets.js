"use strict";

import schema from './schema';
import RecordSetsDialog from './recordsetsdialog';
import userInfo from './userinfo';
import commonText from './localization/common';

export default {
        task: 'recordsets',
        title: commonText('recordSets'),
        icon: '/static/img/record sets.png',
        execute: function() {
            var recordSets = new schema.models.RecordSet.LazyCollection({
                filters: { specifyuser: userInfo.id, type: 0, domainfilter: true,
                           orderby: '-timestampcreated' }
            });
            recordSets.fetch({ limit: 5000 }) // That's a lot of record sets
                .done(function() {
                    new RecordSetsDialog({ recordSets: recordSets, readOnly: userInfo.isReadOnly }).render();
                });
        }
    };

