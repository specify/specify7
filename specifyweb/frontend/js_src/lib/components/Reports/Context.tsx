import React from 'react';

import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { reportEvents } from './events';
import { ReportsView } from './index';

export function ReportEventHandler(): JSX.Element | null {
  const [resource, setResource] = React.useState<
    SpecifyResource<AnySchema> | undefined
  >(undefined);
  React.useEffect(() => reportEvents.on('createReport', setResource), []);
  return typeof resource === 'object' ? (
    <ReportsView
      autoSelectSingle
      resourceId={resource.id}
      table={resource.specifyTable}
      onClose={(): void => setResource(undefined)}
    />
  ) : null;
}
