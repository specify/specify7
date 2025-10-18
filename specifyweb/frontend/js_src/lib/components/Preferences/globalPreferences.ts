import { BasePreferences } from './BasePreferences';
import { globalPreferenceDefinitions } from './GlobalDefinitions';

export type GlobalPreferenceValues = {
  readonly auditing: {
    readonly auditing: {
      readonly enableAuditLog: boolean;
      readonly logFieldLevelChanges: boolean;
    };
  };
  readonly formatting: {
    readonly formatting: {
      readonly fullDateFormat: string;
      readonly monthYearDateFormat: string;
    };
  };
  readonly attachments: {
    readonly attachments: {
      readonly attachmentThumbnailSize: number;
    };
  };
};

export const globalPreferences = new BasePreferences({
  definitions: globalPreferenceDefinitions,
  values: {
    resourceName: 'GlobalPreferences',
    fetchUrl: '/context/app.resource/',
  },
  defaultValues: undefined,
  developmentGlobal: '_globalPreferences',
  syncChanges: false,
});
