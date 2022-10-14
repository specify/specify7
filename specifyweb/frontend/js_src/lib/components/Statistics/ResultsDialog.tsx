import React from 'react';

import { QueryBuilder } from '../QueryBuilder/Wrapped';

import { SpQuery } from '../DataModel/types';

import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { commonText } from '../../localization/common';
import { SpecifyResource } from '../DataModel/legacyTypes';

export function FrontEndStatsResultDialog({
  query,
  onClose: handleClose,
  statLabel,
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly onClose: () => void;
  readonly statLabel: string;
}): JSX.Element | null {
  return typeof query === 'object' ? (
    <Dialog
      buttons={<Button.DialogClose>{commonText('close')}</Button.DialogClose>}
      className={{
        container: dialogClassNames.wideContainer,
      }}
      header={statLabel}
      onClose={handleClose}
    >
      <QueryBuilder
        autoRun
        isEmbedded
        isReadOnly={false}
        query={query}
        recordSet={undefined}
      />
    </Dialog>
  ) : null;
}
