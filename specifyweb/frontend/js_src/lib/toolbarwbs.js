'use strict';

import WbsDialog from './components/wbsdialog';
import commonText from './localization/common';

export default {
  task: 'workbenches',
  title: commonText('workbench'),
  icon: '/static/img/workbench.png',
  execute() {
    new WbsDialog({ showTemplates: false }).render();
  },
};
