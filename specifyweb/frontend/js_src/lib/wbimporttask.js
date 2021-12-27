'use strict';

import router from './router';
import app from './specifyapp';

export default function () {
  router.route('workbench-import/', 'workbench-import', () =>
    import('./components/wbimport').then((WbImport) =>
        app.setCurrentView(new WbImport());
    )
  );
}
