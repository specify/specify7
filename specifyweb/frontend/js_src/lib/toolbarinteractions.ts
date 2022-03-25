import { icons } from './components/icons';
import type { MenuItem } from './components/main';
import { InteractionsDialog } from './components/interactionsdialog';
import commonText from './localization/common';
import createBackboneView from './components/reactbackboneextend';
import { hasToolPermission } from './permissions';

const InteractionsView = createBackboneView(InteractionsDialog);

const menuItem: MenuItem = {
  task: 'interactions',
  title: commonText('interactions'),
  icon: icons.chat,
  isOverlay: true,
  enabled: () => hasToolPermission('recordSets', 'read'),
  view: (props) => new InteractionsView(props).render(),
};

export default menuItem;
