import React from 'react';

import type { AnyTree } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { formsText } from '../localization/forms';
import { Link } from './basic';
import { ProtectedAction } from './permissiondenied';

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
        {formsText('findUsages')}
      </Link.Small>
    </ProtectedAction>
  );
}
