import React from 'react';

import { fetchCollection } from '../collection';
import type {
  Disposal,
  DisposalPreparation,
  Gift,
  GiftPreparation,
  Loan,
  LoanPreparation,
  RecordSet,
} from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { schema } from '../schema';
import type { Collection, SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { userInformation } from '../userinfo';
import { FormTableCollection } from './formtable';
import { InteractionDialog } from './interactiondialog';

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
              Loan | Gift | Disposal
            >,
          }}
          model={schema.models.CollectionObject}
          itemCollection={
            props.collection as Collection<
              LoanPreparation | GiftPreparation | DisposalPreparation
            >
          }
          recordSetsPromise={recordSetsPromise}
          onClose={(): void => setRecordSetsPromise(undefined)}
          searchField={schema.models.CollectionObject.getLiteralField(
            'catalogNumber'
          )}
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
              orderBy:
                (props.sortField as '-timestampCreated') ?? '-timestampCreated',
              limit: 5000,
            })
          )
        }
      />
    </>
  );
}
