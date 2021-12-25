"use strict";

var schema              = require('./schema.js');
var RecordSetsDialog    = require('./recordsetsdialog.js');
var userInfo            = require('./userinfo').default;
const commonText = require('./localization/common').default;

module.exports =  {
        task: 'recordsets',
        title: commonText('recordSets'),
        icon: '/static/img/record sets.png',
        view({ onClose }) {
            const recordSets = new schema.models.RecordSet.LazyCollection({
                filters: { specifyuser: userInfo.id, type: 0, domainfilter: true,
                           orderby: '-timestampcreated' }
            });
            const promise = new Promise(resolve=>
                recordSets
                    .fetch({ limit: 5000 })
                    .done(()=>resolve(recordSets))
            );
            return new RecordSetsDialog({
                recordSets: promise,
                readOnly: userInfo.isReadOnly,
                onClose,
            }).render();
        }
    };

