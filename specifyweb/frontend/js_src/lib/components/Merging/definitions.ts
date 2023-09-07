import { Tables } from '../DataModel/types';
import { SerializedResource } from '../DataModel/helperTypes';
import { mergingText } from '../../localization/merging';

export const recordMergingTableSpec: Partial<{
  [TABLE_NAME in keyof Tables]: {
    filterIgnore?: (
      resource: SerializedResource<Tables[TABLE_NAME]>
    ) => SerializedResource<Tables[TABLE_NAME]> | undefined;
    dialogSpecificText: string;
  };
}> = {
  Agent: {
    filterIgnore(resource) {
      const groups = resource.groups;
      const hasGroup = Array.isArray(groups) && groups.length !== 0;
      return hasGroup ? resource : undefined;
    },
    dialogSpecificText: mergingText.agentContainsGroupDescription(),
  },
};
