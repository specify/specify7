define([
    'require', 'schema', 'wbsdialog'
], function(require, schema, WbsDialog) {
    "use strict";

    return {
        task: 'workbenches',
        title: 'Workbenches',
        icon: '/images/Workbench32x32.png',
        execute: function() {
            var app = require('specifyapp');
            var wbs = new schema.models.Workbench.LazyCollection({
                filters: { specifyuser: app.user.id, orderby: 'name' }
            });
            wbs.fetch({ limit: 5000 }) // That's a lot of workbenches
                .done(function() {
                    new WbsDialog({ wbs: wbs, readOnly: app.isReadOnly }).render();
                });
        }
    };
});
