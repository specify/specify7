"use strict";

var schema              = require('./schema.js');
var RecordSetsDialog    = require('./recordsetsdialog.js');
var userInfo            = require('./userinfo.js');
const commonText = require('./localization/common.tsx').default;

module.exports =  {
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

