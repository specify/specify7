define([
    'schema', 'wbsdialog', 'userinfo'
], function(schema, WbsDialog, userInfo) {
    "use strict";

    return {
        task: 'workbenches',
        title: 'Workbenches',
        icon: '/images/Workbench32x32.png',
        execute: function() {
            var wbs = new schema.models.Workbench.LazyCollection({
                filters: { specifyuser: userInfo.id, orderby: 'name' }
            });
            wbs.fetch({ limit: 5000 }) // That's a lot of workbenches
                .done(function() {
                    new WbsDialog({ wbs: wbs, readOnly: userInfo.isReadOnly }).render();
                });
        }
    };
});
