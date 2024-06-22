import React from "react";

import { f } from "../../utils/functools";
import type { Relationship } from "../DataModel/specifyField";
import { SubViewContext } from "../Forms/SubView";

export function useRenderedResourceId(relationship:Relationship): number | undefined {
  const subviewContext = React.useContext(SubViewContext);
  const parentContext = React.useMemo(
    () => subviewContext?.parentContext ?? [],
    [subviewContext?.parentContext]
  );

  return React.useMemo(
    () =>
      parentContext.length === 0 || relationship.isDependent()
        ? undefined
        : f.maybe(
            parentContext.find(
              ({ relationship: parentRelationship }) =>
                parentRelationship === relationship.getReverse()
            ),
            ({ parentResource: { id } }) => id
          ),
    [parentContext, relationship]
  );
}