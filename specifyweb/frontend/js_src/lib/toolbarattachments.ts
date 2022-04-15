import { attachmentsAvailable, attachmentSettingsPromise } from './attachments';
import { icons } from './components/icons';
import { commonText } from './localization/common';
import { hasTablePermission } from './permissions';

export const menuItem = attachmentSettingsPromise.then(() => ({
  task: 'attachments',
  title: commonText('attachments'),
  icon: icons.link,
  enabled: () =>
    attachmentsAvailable() && hasTablePermission('Attachment', 'read'),
  isOverlay: true,
  view: '/specify/attachments/',
}));
