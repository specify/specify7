import { mergingText } from '../../localization/merging';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { Tables } from '../DataModel/types';

export const recordMergingTableSpec: Partial<{
  readonly [TABLE_NAME in keyof Tables]: {
    readonly filterIgnore?: (
      resource: SerializedResource<Tables[TABLE_NAME]>
    ) => SerializedResource<Tables[TABLE_NAME]> | undefined;
    readonly dialogSpecificText: string;
  };
}> = {
  Agent: {
    filterIgnore(resource) {
      const groups = resource.groups;
      const hasGroup = Array.isArray(groups) && groups.length > 0;
      return hasGroup ? resource : undefined;
    },
    dialogSpecificText: mergingText.agentContainsGroupDescription(),
  },
};
