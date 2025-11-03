import { attachmentsText } from '../../localization/attachments';
import { preferencesText } from '../../localization/preferences';
import { localized } from '../../utils/types';
import { definePref } from './types';

export const FULL_DATE_FORMAT_OPTIONS = [
  'yyyy-MM-dd',
  'yyyy MM dd',
  'yyyy.MM.dd',
  'yyyy/MM/dd',
  'MM dd yyyy',
  'MM-dd-yyyy',
  'MM.dd.yyyy',
  'MM/dd/yyyy',
  'dd MM yyyy',
  'dd MMM yyyy',
  'dd-MM-yyyy',
  'dd-MMM-yyyy',
  'dd.MM.yyyy',
  'dd.MMM.yyyy',
  'dd/MM/yyyy',
] as const;

export const MONTH_YEAR_FORMAT_OPTIONS = [
  'YYYY-MM',
  'MM/YYYY',
  'YYYY/MM',
] as const;

export const globalPreferenceDefinitions = {
  formatting: {
    title: preferencesText.formatting(),
    subCategories: {
      formatting: {
        title: preferencesText.general(),
        items: {
          fullDateFormat: definePref<string>({
            title: preferencesText.fullDateFormat(),
            description: preferencesText.fullDateFormatDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: 'yyyy-MM-dd',
            values: FULL_DATE_FORMAT_OPTIONS.map((value) => ({
              value,
              title: localized(value),
            })),
          }),
          monthYearDateFormat: definePref<string>({
            title: preferencesText.monthYearDateFormat(),
            description: preferencesText.monthYearDateFormatDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: 'YYYY-MM',
            values: MONTH_YEAR_FORMAT_OPTIONS.map((value) => ({
              value,
              title: localized(value),
            })),
          }),
        },
      },
    },
  },
  auditing: {
    title: preferencesText.auditing(),
    subCategories: {
      auditing: {
        title: preferencesText.general(),
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
    },
  },
  attachments: {
    title: attachmentsText.attachments(),
    subCategories: {
      attachments: {
        title: preferencesText.general(),
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
