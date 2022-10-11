import React from 'react';

import { formsText } from '../../localization/forms';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { schema } from '../DataModel/schema';
import { QueryBuilder } from '../QueryBuilder/Wrapped';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import { createQuery } from '../QueryBuilder';
import { useBooleanState } from '../../hooks/useBooleanState';
import { SpQuery, SpQueryField, Tables } from '../DataModel/types';
import { RA } from '../../utils/types';
import { SerializedResource } from '../DataModel/helperTypes';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { commonText } from '../../localization/common';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { addMissingFields } from '../DataModel/addMissingFields';
import { serializeResource } from '../DataModel/helpers';
import { makeQueryField } from '../QueryBuilder/fromTree';

export function FrontEndStatsResultDialog({
  query,
  onClose: handleClose,
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly onClose: () => void;
}): JSX.Element | null {
  return typeof query === 'object' ? (
    <Dialog
      buttons={<Button.DialogClose>{commonText('close')}</Button.DialogClose>}
      className={{
        container: dialogClassNames.wideContainer,
      }}
      header={formsText('historyOfEdits')}
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
