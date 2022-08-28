import React from 'react';

import { fetchCollection } from '../DataModel/collection';
import { userInformation } from '../InitialContext/userInformation';
import { RecordSetsDialog } from '../QueryBuilder/RecordSets';
import { OverlayContext } from '../Router/Router';

export function RecordSetsOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);

  const recordSetsPromise = React.useMemo(
    async () =>
      fetchCollection('RecordSet', {
        specifyUser: userInformation.id,
        type: 0,
        limit: 5000,
        domainFilter: true,
        orderBy: '-timestampCreated',
      }),
    []
  );
  return (
    <RecordSetsDialog
      isReadOnly={false}
      recordSetsPromise={recordSetsPromise}
      onClose={handleClose}
    />
  );
}
