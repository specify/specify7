define([
    'require', 'schema', 'recordsetsdialog'
], function(require, schema, RecordSetsDialog) {
    "use strict";

    return {
        task: 'recordsets',
        title: 'Record Sets',
        icon: '/images/RecordSet32x32.png',
        execute: function() {
            var app = require('specifyapp');
            var recordSets = new schema.models.RecordSet.LazyCollection({
                filters: { specifyuser: app.user.id, type: 0, domainfilter: true,
                           orderby: '-timestampcreated' }
            });
            recordSets.fetch({ limit: 5000 }) // That's a lot of record sets
                .done(function() {
                    new RecordSetsDialog({ recordSets: recordSets, readOnly: app.isReadOnly }).render();
                });
        }
    };
});
