/** Definitions for preferences shared by all users and collections. */

import { attachmentsText } from '../../localization/attachments';
import { preferencesText } from '../../localization/preferences';
import { localized } from '../../utils/types';
import { definePref } from './types';

export const globalDateFormats = [
  'MM dd yy',
  'MM dd yyyy',
  'MM-dd-yy',
  'MM-dd-yyyy',
  'MM.dd.yy',
  'MM.dd.yyyy',
  'MM/dd/yy',
  'MM/dd/yyyy',
  'dd MM yy',
  'dd MM yyyy',
  'dd MMM yyyy',
  'dd-MM-yy',
  'dd-MM-yyyy',
  'dd-MMM-yyyy',
  'dd.MM.yy',
  'dd.MM.yyyy',
  'dd.MMM.yyyy',
  'dd/MM/yy',
  'dd/MM/yyyy',
  'dd/MMM/yyyy',
  'yyyy MM dd',
  'yyyy-MM-dd',
  'yyyy.MM.dd',
  'yyyy/MM/dd',
] as const;

export const globalMonthYearFormats = [
  'MM yy',
  'MM yyyy',
  'MM-yy',
  'MM-yyyy',
  'MM.yy',
  'MM.yyyy',
  'MM/yy',
  'MM/yyyy',
  'MMM yyyy',
  'MMM-yyyy',
  'MMM.yyyy',
  'MMM/yyyy',
  'yyyy MM',
  'yyyy-MM',
  'yyyy.MM',
  'yyyy/MM',
] as const;

export const globalPreferenceDefinitions = {
  general: {
    title: preferencesText.general(),
    subCategories: {
      auditing: {
        title: preferencesText.globalAuditing(),
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
          fullDateFormat: definePref<(typeof globalDateFormats)[number]>({
            title: preferencesText.fullDateFormat(),
            description: preferencesText.fullDateFormatDescription(),
            requiresReload: true,
            visible: true,
            defaultValue: 'yyyy-MM-dd',
            values: globalDateFormats.map((value) => ({
              value,
              title: localized(value),
            })),
          }),
          monthYearDateFormat: definePref<string>({
            title: preferencesText.monthYearDateFormat(),
            description: preferencesText.monthYearDateFormatDescription(),
            requiresReload: true,
            visible: true,
            defaultValue: 'MM/yyyy',
            values: globalMonthYearFormats.map((value) => ({
              value,
              title: localized(value),
            })),
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
            type: 'java.lang.Long',
          }),
        },
      },
    },
  },
} as const;
