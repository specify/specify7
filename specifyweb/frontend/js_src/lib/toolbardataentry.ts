import { FormsDialog } from './components/formsdialog';
import { icons } from './components/icons';
import type { MenuItem } from './components/main';
import { commonText } from './localization/common';
import { createBackboneView } from './components/reactbackboneextend';
import { getUserPref } from './preferencesutils';

export const FormsDialogView = createBackboneView(FormsDialog);
export const menuItem: MenuItem = {
  task: 'data',
  title: commonText('dataEntry'),
  icon: icons.pencilAt,
  isOverlay: true,
  enabled: () => getUserPref('header', 'menu', 'showDataEntry'),
  view: ({ onClose }) => new FormsDialogView({ onClose }),
};
