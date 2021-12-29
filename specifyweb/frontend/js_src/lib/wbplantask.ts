import * as app from './specifyapp';
import router from './router';
import NotFoundView from './notfoundview';
import ajax, { Http } from './ajax';
import { Dataset } from './components/wbplanview';

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
