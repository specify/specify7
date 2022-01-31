import FormsDialog from './components/formsdialog';
import { icons } from './components/icons';
import type { MenuItem } from './components/main';
import commonText from './localization/common';

const menuItem: MenuItem = {
  task: 'data',
  title: commonText('dataEntry'),
  icon: icons.pencilAt,
  view: ({ onClose }) => new FormsDialog({ onClose }),
};

export default menuItem;
