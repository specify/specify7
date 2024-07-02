import React from 'react';

import { commonText } from '../../localization/common';
import type { IR } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Relationship } from '../DataModel/specifyField';
import { FormMeta } from '../FormMeta';
import type { ViewDescription } from '../FormParse';
import { hasTablePermission } from '../Permissions/helpers';

export function FormTableUtils({
  displayViewButton,
  isExpanded,
  resource,
  displayDeleteButton,
  relationship,
  onDelete: handleDelete,
  expandedViewDefinition,
}: {
  readonly displayViewButton: boolean;
  readonly isExpanded: IR<boolean | undefined>;
  readonly resource: SpecifyResource<AnySchema>;
  readonly displayDeleteButton: boolean;
  readonly relationship: Relationship;
  readonly onDelete:
    | ((resource: SpecifyResource<AnySchema>) => void)
    | undefined;
  readonly expandedViewDefinition: ViewDescription | undefined;
}): JSX.Element {
  return (
    <div className="flex h-full flex-col gap-2" role="cell">
      {displayViewButton && isExpanded[resource.cid] === true ? (
        <Link.Small
          aria-label={commonText.openInNewTab()}
          className="flex-1"
          href={resource.viewUrl()}
          title={commonText.openInNewTab()}
        >
          {icons.externalLink}
        </Link.Small>
      ) : undefined}
      {displayDeleteButton &&
      (!resource.isNew() ||
        hasTablePermission(relationship.relatedTable.name, 'delete')) ? (
        <Button.Small
          aria-label={commonText.remove()}
          className="h-full"
          disabled={
            !resource.isNew() &&
            !hasTablePermission(resource.specifyTable.name, 'delete')
          }
          title={commonText.remove()}
          onClick={(): void => handleDelete!(resource)}
        >
          {icons.trash}
        </Button.Small>
      ) : undefined}
      {isExpanded[resource.cid] === true && (
        <FormMeta
          className="flex-1"
          resource={resource}
          viewDescription={expandedViewDefinition}
        />
      )}
    </div>
  );
}
