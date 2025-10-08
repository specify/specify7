/**
 * Definitions for global (institution-wide) preferences
 */

import { attachmentsText } from '../../localization/attachments';
import { preferencesText } from '../../localization/preferences';
import { definePref } from './types';

const FULL_DATE_FORMAT_OPTIONS = [
  {
    value: 'yyyy-MM-dd',
    title: preferencesText.dateFormatIso(),
  },
  {
    value: 'MM/dd/yyyy',
    title: preferencesText.dateFormatMonthDayYearSlash(),
  },
  {
    value: 'dd/MM/yyyy',
    title: preferencesText.dateFormatDayMonthYearSlash(),
  },
  {
    value: 'yyyy/MM/dd',
    title: preferencesText.dateFormatIsoSlash(),
  },
  {
    value: 'MM-dd-yyyy',
    title: preferencesText.dateFormatMonthDayYearDash(),
  },
] as const;

const MONTH_YEAR_FORMAT_OPTIONS = [
  {
    value: 'YYYY-MM',
    title: preferencesText.monthFormatIso(),
  },
  {
    value: 'MM/YYYY',
    title: preferencesText.monthFormatMonthYearSlash(),
  },
  {
    value: 'YYYY/MM',
    title: preferencesText.monthFormatYearMonthSlash(),
  },
] as const;

export const globalPreferenceDefinitions = {
  general: {
    title: preferencesText.general(),
    subCategories: {
      auditing: {
        title: preferencesText.auditing(),
        items: {
          'auditing.do_audits': definePref<boolean>({
            title: preferencesText.enableAuditLog(),
            description: preferencesText.enableAuditLogDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          'auditing.audit_field_updates': definePref<boolean>({
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
        title: preferencesText.dateFormatting(),
        items: {
          'ui.formatting.scrdateformat': definePref<string>({
            title: preferencesText.fullDateFormat(),
            description: preferencesText.fullDateFormatDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: 'yyyy-MM-dd',
            values: FULL_DATE_FORMAT_OPTIONS,
          }),
          'ui.formatting.scrmonthformat': definePref<string>({
            title: preferencesText.monthYearDateFormat(),
            description: preferencesText.monthYearDateFormatDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: 'YYYY-MM',
            values: MONTH_YEAR_FORMAT_OPTIONS,
          }),
        },
      },
    },
  },
  attachments: {
    title: attachmentsText.attachments(),
    subCategories: {
      thumbnails: {
        title: preferencesText.attachmentsThumbnails(),
        items: {
          'attachment.preview_size': definePref<number>({
            title: preferencesText.attachmentPreviewSize(),
            description: preferencesText.attachmentPreviewSizeDescription(),
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
