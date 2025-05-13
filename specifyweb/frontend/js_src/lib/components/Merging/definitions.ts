import type { LocalizedString } from 'typesafe-i18n';

import { mergingText } from '../../localization/merging';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { Tables } from '../DataModel/types';

export const recordMergingTableSpec: Partial<{
  readonly [TABLE_NAME in keyof Tables]: {
    readonly unmergable?: {
      readonly matches: (
        resource: SerializedResource<Tables[TABLE_NAME]>
      ) => boolean;
      readonly message: LocalizedString;
    };
  };
}> = {
  Agent: {
    unmergable: {
      matches(resource) {
        const groups = resource.groups;
        return Array.isArray(groups) && groups.length > 0;
      },
      message: mergingText.agentContainsGroupDescription(),
    },
  },
  Locality: {},
  PaleoContext: {},
  CollectingEvent: {},
};
