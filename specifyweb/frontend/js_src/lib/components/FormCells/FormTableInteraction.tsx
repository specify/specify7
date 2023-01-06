import React from 'react';

import { fetchCollection } from '../DataModel/collection';
import type {
  Disposal,
  DisposalPreparation,
  Gift,
  GiftPreparation,
  Loan,
  LoanPreparation,
  RecordSet,
} from '../DataModel/types';
import { schema } from '../DataModel/schema';
import type { Collection, SpecifyModel } from '../DataModel/specifyModel';
import type { RA } from '../../utils/types';
import { userInformation } from '../InitialContext/userInformation';
import { InteractionDialog } from '../Interactions/InteractionDialog';
import { SerializedResource } from '../DataModel/helperTypes';
import { FormTableCollection } from './FormTableCollection';
import { SubViewSortField } from '../FormParse/cells';
import { toSmallSortConfig } from '../Molecules/Sorting';
import { getField } from '../DataModel/helpers';

const defaultOrder: SubViewSortField = {
  fieldNames: ['timestampCreated'],
  direction: 'desc',
};

export function FormTableInteraction(
  props: Omit<
    Parameters<typeof FormTableCollection>[0],
    'onAdd' | 'onFetchMore'
  >
): JSX.Element {
  const [recordSetsPromise, setRecordSetsPromise] = React.useState<
    | Promise<{
        readonly records: RA<SerializedResource<RecordSet>>;
        readonly totalCount: number;
      }>
    | undefined
  >(undefined);
  return (
    <>
      {typeof recordSetsPromise === 'object' &&
      typeof props.collection.related === 'object' ? (
        <InteractionDialog
          action={{
            model: props.collection.related.specifyModel as SpecifyModel<
              Disposal | Gift | Loan
            >,
          }}
          itemCollection={
            props.collection as Collection<
              DisposalPreparation | GiftPreparation | LoanPreparation
            >
          }
          model={schema.models.CollectionObject}
          recordSetsPromise={recordSetsPromise}
          searchField={getField(
            schema.models.CollectionObject,
            'catalogNumber'
          )}
          onClose={(): void => setRecordSetsPromise(undefined)}
        />
      ) : undefined}
      <FormTableCollection
        {...props}
        onAdd={(): void =>
          setRecordSetsPromise(
            fetchCollection('RecordSet', {
              specifyUser: userInformation.id,
              type: 0,
              dbTableId: schema.models.CollectionObject.tableId,
              domainFilter: true,
              orderBy: toSmallSortConfig(
                props.sortField ?? defaultOrder
              ) as 'name',
              limit: 5000,
            })
          )
        }
      />
    </>
  );
}
