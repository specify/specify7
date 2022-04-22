import { icons } from './components/icons';
import type { MenuItem } from './components/main';
import { InteractionsDialog } from './components/interactionsdialog';
import { commonText } from './localization/common';
import { createBackboneView } from './components/reactbackboneextend';
import { hasToolPermission } from './permissions';
import { getUserPref } from './preferencesutils';

const InteractionsView = createBackboneView(InteractionsDialog);

export const menuItem: MenuItem = {
  task: 'interactions',
  title: commonText('interactions'),
  icon: icons.chat,
  isOverlay: true,
  enabled: () =>
    getUserPref('header', 'menu', 'showInteractions') &&
    hasToolPermission('recordSets', 'read'),
  view: (props) => new InteractionsView(props).render(),
};
