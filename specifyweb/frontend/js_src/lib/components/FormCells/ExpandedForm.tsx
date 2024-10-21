import React from 'react';

import { commonText } from '../../localization/common';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { icons } from '../Atoms/Icons';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { ViewDescription } from '../FormParse';
import { SpecifyForm } from '../Forms/SpecifyForm';

export function ExpandedForm({
  resource,
  expandedViewDefinition,
  collapsedViewDefinition,
  onCollapse: handleCollapse,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly expandedViewDefinition: ViewDescription | undefined;
  readonly collapsedViewDefinition: ViewDescription;
  readonly onCollapse: () => void;
}): JSX.Element {
  return (
    <>
      <div className="h-full" role="cell">
        <Button.Small
          aria-label={commonText.collapse()}
          className="h-full"
          title={commonText.collapse()}
          onClick={handleCollapse}
        >
          {icons.chevronDown}
        </Button.Small>
      </div>
      <DataEntry.Cell
        align="left"
        colSpan={collapsedViewDefinition.columns.length}
        role="cell"
        tabIndex={-1}
        verticalAlign="stretch"
        visible
      >
        <SpecifyForm
          display="inline"
          resource={resource}
          viewDefinition={expandedViewDefinition}
        />
      </DataEntry.Cell>
    </>
  );
}
