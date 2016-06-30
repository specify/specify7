"use strict";

var schema      = require('./schema.js');
var WbsDialog   = require('./wbsdialog.js');
var userInfo    = require('./userinfo.js');

module.exports =  {
    task: 'workbenches',
    title: 'WorkBench',
    disabled(userInfo) {
        return !userInfo.available_tasks.includes('Workbench');
    },
    icon: '/static/img/workbench.png',
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

