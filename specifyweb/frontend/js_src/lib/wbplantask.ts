import ajax, { Http } from './ajax';
import type { Dataset } from './components/wbplanview';
import NotFoundView from './notfoundview';
import router from './router';
import * as app from './specifyapp';

export default function () {
  router.route('workbench-plan/:id/', 'workbench-plan', (id: string) => {
    Promise.all([
      import('./components/wbplanviewwrapper'),
      ajax<Dataset>(
        `/api/workbench/dataset/${id}/`,
        {
          headers: { Accept: 'application/json' },
        },
        { expectedResponseCodes: [Http.OK, Http.NOT_FOUND] }
      ),
    ]).then(([{ default: WbPlanView }, { status, data: dataset }]) => {
      if (status === Http.NOT_FOUND) app.setCurrentView(new NotFoundView());
      else app.setCurrentView(new WbPlanView({ dataset }));
    });
  });
}
