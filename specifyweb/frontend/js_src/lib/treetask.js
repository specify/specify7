'use strict';

import router from './router';

export default function () {
  router.route('tree/:table/', 'tree', (table) =>
    import('./treeview').then(({default: treeView}) => treeView(table))
  );
};
