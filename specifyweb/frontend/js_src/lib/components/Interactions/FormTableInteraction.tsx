import React from 'react';

import type { RA } from '../../utils/types';
import { fetchCollection } from '../DataModel/collection';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { Collection, SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import type {
  Disposal,
  DisposalPreparation,
  Gift,
  GiftPreparation,
  Loan,
  LoanPreparation,
  RecordSet,
} from '../DataModel/types';
import { FormTableCollection } from '../FormCells/FormTableCollection';
import type { SubViewSortField } from '../FormParse/cells';
import { userInformation } from '../InitialContext/userInformation';
import { toSmallSortConfig } from '../Molecules/Sorting';
import { InteractionDialog } from './InteractionDialog';

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
          actionTable={
            props.collection.related?.specifyTable as SpecifyTable<
              Disposal | Gift | Loan
            >
          }
          itemCollection={
            props.collection as Collection<
              DisposalPreparation | GiftPreparation | LoanPreparation
            >
          }
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
              dbTableId: tables.CollectionObject.tableId,
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
