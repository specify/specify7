import React from 'react';

import { fetchCollection } from '../../collection';
import { userInformation } from '../../userinfo';
import { RecordSetsDialog } from '../recordsetsdialog';
import { OverlayContext } from '../router';

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
