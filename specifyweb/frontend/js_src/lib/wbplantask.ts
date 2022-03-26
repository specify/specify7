import { ajax, Http } from './ajax';
import { crash } from './components/errorboundary';
import type { Dataset } from './components/wbplanview';
import { NotFoundView } from './notfoundview';
import { router } from './router';
import { setCurrentView } from './specifyapp';
import { f } from './functools';

export default function () {
  router.route('workbench-plan/:id/', 'workbench-plan', (id: string) => {
    f.all({
      wbPlanView: import('./components/wbplanviewwrapper'),
      dataSet: ajax<Dataset>(
        `/api/workbench/dataset/${id}/`,
        {
          headers: { Accept: 'application/json' },
        },
        { expectedResponseCodes: [Http.OK, Http.NOT_FOUND] }
      ),
      treeRanks: import('./treedefinitions').then(
        async ({ fetchTreeRanks }) => fetchTreeRanks
      ),
    })
      .then(
        ({
          wbPlanView: { default: WbPlanView },
          dataSet: { status, data: dataset },
        }) => {
          if (status === Http.NOT_FOUND) setCurrentView(new NotFoundView());
          else setCurrentView(new WbPlanView({ dataset }));
        }
      )
      .catch(crash);
  });
}
