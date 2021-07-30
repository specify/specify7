'use strict';

import router from './router';

function appResources(type, id) {
  import('./appresources').then((appResourcesModule) => {
    const idInt = parseInt(id);
    appResourcesModule[type](isNaN(idInt) ? null : idInt);
  });
}

export default function () {
  router.route('appresources/', 'appresources', () =>
    appResources('appResources')
  );
  router.route('appresources/:id/', 'appresource', (id) =>
    appResources('appResources', id)
  );
  router.route('viewsets/', 'viewsets', () => appResources('viewSets'));
  router.route('viewsets/:id/', 'viewset', (id) =>
    appResources('viewSets', id)
  );
};
