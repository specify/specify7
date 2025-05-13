import React from 'react';

import { formsText } from '../../localization/forms';
import { Link } from '../Atoms/Link';
import type { AnyTree } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { ProtectedAction } from '../Permissions/PermissionDenied';

export function QueryTreeUsages({
  resource,
}: {
  readonly resource: SpecifyResource<AnyTree>;
}): JSX.Element {
  return (
    <ProtectedAction action="execute" resource="/querybuilder/query">
      <Link.Small
        href={`/specify/query/fromtree/${resource.specifyTable.name.toLowerCase()}/${
          resource.id
        }/`}
        target="_blank"
      >
        {formsText.findUsages()}
      </Link.Small>
    </ProtectedAction>
  );
}
