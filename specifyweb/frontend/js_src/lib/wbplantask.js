'use strict';

import * as app from './specifyapp';
import router from './router';
import NotFoundView from './notfoundview';

export default function () {
  router.route('workbench-plan/:id/', 'workbench-plan', (id) => {
    Promise.all([
      import('./components/wbplanviewwrapper'),
      fetch(`/api/workbench/dataset/${id}/`)
    ]).then(([{default: WbPlanView}, response]) => {
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
