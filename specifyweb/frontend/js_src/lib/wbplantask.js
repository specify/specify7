'use strict';

const app = require('./specifyapp.js');
const router = require('./router.js');
const NotFoundView = require('./notfoundview.js');
const commonText = require('./localization/common').default;

module.exports = function () {
  router.route('workbench-plan/:id/', 'workbench-plan', (id) => {
    Promise.allSettled(
      import('./components/wbplanview'),
      fetch(`/api/workbench/dataset/${id}/`)
    ).then(([{ default: WbPlanView }, response]) => {
      if (response.status === 404) {
        app.setCurrentView(new NotFoundView());
      } else
        response
          .json()
          .then((dataset) =>
            app.setCurrentView(new WbPlanView({ dataset: dataset }))
          );
    });
  });
};
