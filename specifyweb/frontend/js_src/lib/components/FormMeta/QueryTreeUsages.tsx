import React from 'react';

import type { SpecifyResource } from '../DataModel/legacyTypes';
import { formsText } from '../../localization/forms';
import { Link } from '../Atoms/Link';
import { ProtectedAction } from '../Permissions/PermissionDenied';
import { AnyTree } from '../DataModel/helperTypes';

export function QueryTreeUsages({
  resource,
}: {
  readonly resource: SpecifyResource<AnyTree>;
}): JSX.Element {
  return (
    <ProtectedAction action="execute" resource="/querybuilder/query">
      <Link.Small
        href={`/specify/query/fromtree/${resource.specifyModel.name.toLowerCase()}/${
          resource.id
        }/`}
        target="_blank"
      >
        {formsText.findUsages()}
      </Link.Small>
    </ProtectedAction>
  );
}
