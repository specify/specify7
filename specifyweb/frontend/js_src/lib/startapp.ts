import { ajax, ping } from './ajax';
import Backbone from './backbone';
import * as businessRules from './businessrules';
import { crash } from './components/errorboundary';
import * as navigation from './navigation';
import { NotFoundView } from './notfoundview';
import * as querystring from './querystring';
import { promiseToXhr } from './resourceapi';
import { router } from './router';
import { setCurrentView } from './specifyapp';
import { defined } from './types';
import { f } from './functools';

/*
 * Make Backbone use fetch() API instead of JQuery so that all errors
 * can be handled consistently in a single place
 */
Backbone.ajax = function (request): JQueryXHR {
  if (typeof request === 'undefined') throw new Error('Undefined Request');
  const url = defined(request.url);
  return promiseToXhr(
    ajax(
      request.type === 'GET' && typeof request.data === 'object'
        ? querystring.format(url, request.data ?? {})
        : url,
      {
        method: request.type,
        headers: {
          Accept: 'application/json',
          'Content-Type':
            typeof request.contentType === 'string'
              ? request.contentType
              : undefined,
        },
        body: request.type === 'GET' ? undefined : request.data,
      }
    )
      .then(({ data }) => request.success?.(data))
      .catch((error) => {
        request?.error?.(error, error, error);
        throw error;
      })
  );
};

const tasksPromise = Promise.all([
  import('./welcometask'),
  import('./datatask'),
  import('./components/querytask'),
  import('./treetask'),
  import('./components/expresssearchtask'),
  import('./components/toolbar/schema'),
  import('./components/attachmentstask'),
  import('./wbtask'),
  import('./wbimporttask'),
  import('./wbplantask'),
  import('./appresourcetask'),
  import('./components/toolbar/security'),
]).then((tasks) => (): void => tasks.forEach(({ default: task }) => task()));

router
  .route('*whatever', 'notFound', function () {
    setCurrentView(new NotFoundView());
  })
  .route('test_error/', 'testError', function () {
    void ping('/api/test_error/');
  });

export default function appStart(): void {
  console.info('specify app starting');
  businessRules.enable(true);
  tasksPromise
    .then(f.call)
    .then(() => navigation.start())
    .catch(crash);
}
