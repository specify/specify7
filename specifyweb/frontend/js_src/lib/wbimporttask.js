'use strict';

import router from './router';

export default function () {
  router.route('workbench-import/', 'workbench-import', () =>
    import('./wbimport').then((wbImport) => wbImport())
  );
};
