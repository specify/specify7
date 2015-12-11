define(['schema', 'recordsetsdialog', 'userinfo'], function(schema, RecordSetsDialog, userInfo) {
    "use strict";

    return {
        task: 'recordsets',
        title: 'Record Sets',
        icon: '/images/RecordSet32x32.png',
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
});
