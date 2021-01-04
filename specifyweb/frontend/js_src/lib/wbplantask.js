"use strict";

const app = require('./specifyapp.js');
const router = require('./router.js');
const schema = require('./schema.js');

module.exports =  function() {
    router.route('workbench-plan/:id/', 'workbench-plan', id => {
        require.ensure(['./wbplanview.jsx'], require => {
            const PlanView = require('./wbplanview.jsx');
            const workbench = new schema.models.Workbench.Resource({id: id});
            workbench.fetch().fail(app.handleError).done(() => {
                app.setCurrentView(new PlanView({ wb: workbench }));
            });
        }, "workbench-plan");
    });
};

