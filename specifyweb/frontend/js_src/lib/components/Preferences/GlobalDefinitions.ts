import { preferencesText } from '../../localization/preferences';
import { attachmentsText } from '../../localization/attachments';
import { definePref } from './types';

export const FULL_DATE_FORMAT_OPTIONS = [
  'YYYY-MM-DD',
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYY/MM/DD',
  'DD MMM YYYY',
] as const;

export const MONTH_YEAR_FORMAT_OPTIONS = ['YYYY-MM', 'MM/YYYY', 'YYYY/MM'] as const;

export const globalPreferenceDefinitions = {
  general: {
    title: preferencesText.general(),
    subCategories: {
      auditing: {
        title: preferencesText.auditing(),
        items: {
          enableAuditLog: definePref<boolean>({
            title: preferencesText.enableAuditLog(),
            description: preferencesText.enableAuditLogDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          logFieldLevelChanges: definePref<boolean>({
            title: preferencesText.logFieldLevelChanges(),
            description: preferencesText.logFieldLevelChangesDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
        },
      },
      formatting: {
        title: preferencesText.formatting(),
        items: {
          fullDateFormat: definePref<string>({
            title: preferencesText.fullDateFormat(),
            description: preferencesText.fullDateFormatDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: 'YYYY-MM-DD',
            values: FULL_DATE_FORMAT_OPTIONS.slice(),
          }),
          monthYearDateFormat: definePref<string>({
            title: preferencesText.monthYearDateFormat(),
            description: preferencesText.monthYearDateFormatDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: 'YYYY-MM',
            values: MONTH_YEAR_FORMAT_OPTIONS.slice(),
          }),
        },
      },
      attachments: {
        title: attachmentsText.attachments(),
        items: {
          attachmentThumbnailSize: definePref<number>({
            title: preferencesText.attachmentThumbnailSize(),
            description: preferencesText.attachmentThumbnailSizeDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: 256,
            type: 'java.lang.Integer',
          }),
        },
      },
    },
  },
} as const;
