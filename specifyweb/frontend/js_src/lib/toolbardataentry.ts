import FormsDialog from './components/formsdialog';
import type { MenuItem } from './components/main';
import commonText from './localization/common';

const menuItem: MenuItem = {
  task: 'data',
  title: commonText('dataEntry'),
  icon: '/static/img/data_entry.png',
  view: ({ onClose }) => new FormsDialog({ onClose }),
};

export default menuItem;
