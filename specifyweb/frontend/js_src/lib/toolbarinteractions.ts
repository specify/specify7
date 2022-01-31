import { icons } from './components/icons';
import type { MenuItem } from './components/main';
import InteractionsDialog from './interactionsdialog';
import commonText from './localization/common';

const menuItem: MenuItem = {
  task: 'interactions',
  title: commonText('interactions'),
  icon: icons.chat,
  view: (props) => new InteractionsDialog(props).render(),
};

export default menuItem;
