import { attachmentsAvailable, attachmentSettingsPromise } from './attachments';
import { icons } from './components/icons';
import { commonText } from './localization/common';
import { hasTablePermission } from './permissions';
import { getUserPref } from './preferencesutils';

export const menuItem = attachmentSettingsPromise.then(() => ({
  task: 'attachments',
  title: commonText('attachments'),
  icon: icons.link,
  enabled: () =>
    attachmentsAvailable() &&
    hasTablePermission('Attachment', 'read') &&
    getUserPref('header', 'menu', 'showAttachments'),
  isOverlay: true,
  view: '/specify/attachments/',
}));
