import React from 'react';

import { eventListener } from '../../utils/events';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { ReportsView } from './index';

/**
 * Can trigger this event from anywhere to summon the reports creation dialog
 */
export const reportEvents = eventListener<{
  readonly createReport: SpecifyResource<AnySchema>;
}>();

export function ReportEventHandler(): JSX.Element | null {
  const [resource, setResource] = React.useState<
    SpecifyResource<AnySchema> | undefined
  >(undefined);
  React.useEffect(() => reportEvents.on('createReport', setResource), []);
  return typeof resource === 'object' ? (
    <ReportsView
      autoSelectSingle
      model={resource.specifyModel}
      resourceId={resource.id}
      onClose={(): void => setResource(undefined)}
    />
  ) : null;
}
