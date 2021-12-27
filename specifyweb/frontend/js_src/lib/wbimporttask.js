'use strict';

import router from './router';
import {setCurrentView} from './specifyapp';

export default function () {
  router.route('workbench-import/', 'workbench-import', () =>
    import('./components/wbimport').then((WbImport) =>
      setCurrentView(new WbImport())
    )
  );
}
