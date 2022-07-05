import React from 'react';

import type { AnyTree } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { formsText } from '../localization/forms';
import { hasPermission } from '../permissions';
import { Link } from './basic';

export function QueryTreeUsages({
  resource,
}: {
  readonly resource: SpecifyResource<AnyTree>;
}): JSX.Element | null {
  return hasPermission('/querybuilder/query', 'execute') ? (
    <Link.LikeButton
      href={`/specify/query/fromtree/${resource.specifyModel.name.toLowerCase()}/${
        resource.id
      }/`}
      target="_blank"
    >
      {formsText('findUsages')}
    </Link.LikeButton>
  ) : null;
}
