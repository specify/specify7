import { attachmentsAvailable } from './attachments';
import { icons } from './components/icons';
import type { MenuItem } from './components/main';
import commonText from './localization/common';

const menuItem: MenuItem = {
  task: 'attachments',
  title: commonText('attachments'),
  icon: icons.link,
  enabled: attachmentsAvailable,
  isOverlay: true,
  view: '/specify/attachments/',
};

export default menuItem;
