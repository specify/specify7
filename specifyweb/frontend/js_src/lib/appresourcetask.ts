import { router } from './router';
import { f } from './functools';

function appResources(type: 'appResources' | 'viewSets', id?: string) {
  import('./appresources').then((appResourcesModule) =>
    appResourcesModule[type](f.parseInt(id ?? '') ?? null)
  );
}

export function task() {
  router.route('appresources/', 'appresources', () =>
    appResources('appResources')
  );
  router.route('appresources/:id/', 'appresource', (id: string) =>
    appResources('appResources', id)
  );
  router.route('viewsets/', 'viewsets', () => appResources('viewSets'));
  router.route('viewsets/:id/', 'viewset', (id: string) =>
    appResources('viewSets', id)
  );
}
