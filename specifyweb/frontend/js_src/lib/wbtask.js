'use strict';

import router from './router';

export default function () {
  router.route('workbench/:id/', 'workbench', function (id) {
    import('./wbview').then(({default: WbView}) => WbView(id));
  });
};
