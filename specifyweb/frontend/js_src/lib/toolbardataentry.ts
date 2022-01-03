import type { MenuItem } from './components/main';
import FormsDialog from './formsdialog';
import commonText from './localization/common';

const menuItem: MenuItem = {
  task: 'data',
  title: commonText('dataEntry'),
  icon: '/static/img/data_entry.png',
  path: '/specify/view',
  view: ({ onClose }) => new FormsDialog({ onClose }),
};

export default menuItem;
