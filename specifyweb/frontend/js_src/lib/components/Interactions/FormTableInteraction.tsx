import React from 'react';
import { SubViewSortField } from '../FormParse/cells';
import { FormTableCollection } from '../FormCells/FormTableCollection';
import { RA } from '../../utils/types';
import { SerializedResource } from '../DataModel/helperTypes';
import {
  Disposal,
  DisposalPreparation,
  Gift,
  GiftPreparation,
  Loan,
  LoanPreparation,
  RecordSet,
} from '../DataModel/types';
import { InteractionDialog } from './InteractionDialog';
import { Collection, SpecifyTable } from '../DataModel/specifyTable';
import { fetchCollection } from '../DataModel/collection';
import { userInformation } from '../InitialContext/userInformation';
import { tables } from '../DataModel/tables';
import { toSmallSortConfig } from '../Molecules/Sorting';

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
