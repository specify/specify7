import attachments from './attachments';
import { AttachmentsView } from './attachmentstask';
import type { MenuItem } from './components/main';
import commonText from './localization/common';

const menuItem: MenuItem = {
  task: 'attachments',
  title: commonText('attachments'),
  icon: '/static/img/attachment_icon.png',
  path: '/specify/attachments',
  enabled: attachments.systemAvailable,
  view: () => new AttachmentsView(),
};

export default menuItem;
