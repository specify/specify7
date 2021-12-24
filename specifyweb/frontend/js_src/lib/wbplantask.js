'use strict';

const app = require('./specifyapp.js');
const router = require('./router.js');
const NotFoundView = require('./notfoundview.js');
const commonText = require('./localization/common').default;

module.exports = function () {
  router.route('workbench-plan/:id/', 'workbench-plan', (id) => {
    require.ensure(
      ['./components/wbplanview'],
      (require) => {
        const PlanView = require('./components/wbplanviewwrapper').default;
        fetch(`/api/workbench/dataset/${id}/`).then((response) => {
          if (response.status === 404)
            app.setCurrentView(new NotFoundView());
          else
            response
              .json()
              .then((dataset) =>
                app.setCurrentView(new PlanView({ dataset: dataset }))
              );
        });
      },
      'workbench-plan'
    );
  });
};
