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
  props: Omit<Parameters<typeof FormTableCollection>[0], 'onAdd'>
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
          searchField={schema.models.CollectionObject.getLiteralField(
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
