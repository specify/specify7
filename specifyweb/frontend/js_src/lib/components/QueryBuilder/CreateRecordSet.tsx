import React from 'react';
import type { State } from 'typesafe-reducer';

import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { deserializeResource, serializeResource } from '../DataModel/serializers';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { createResource } from '../DataModel/resource';
import type { RecordSet, SpQuery, Tables } from '../DataModel/types';
import { raise } from '../Errors/Crash';
import { recordSetView } from '../FormParse/webOnlyViews';
import { ResourceView } from '../Forms/ResourceView';
import { RecordSetCreated, recordSetFromQueryLoading } from './Components';
import {strictGetTable, tables} from "../DataModel/tables";

/**
 * Create a record set from selected records.
 * See also `MakeRecordSetButton`
 */
export function CreateRecordSet({
  getIds,
  baseTableName,
  queryResource,
}: {
  readonly getIds: () => RA<number>;
  readonly baseTableName: keyof Tables;
  readonly queryResource: SpecifyResource<SpQuery> | undefined;
}): JSX.Element {
  const [state, setState] = React.useState<
    | State<'Editing', { readonly recordSet: SpecifyResource<RecordSet> }>
    | State<'Main'>
    | State<'Saved', { readonly recordSet: SpecifyResource<RecordSet> }>
    | State<'Saving'>
  >({ type: 'Main' });

  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        onClick={(): void => {
          const recordSet = new tables.RecordSet.Resource();
          if (queryResource !== undefined && !queryResource.isNew())
            recordSet.set('name', queryResource.get('name'));
          setState({
            type: 'Editing',
            recordSet,
          });
        }}
      >
        {queryText.createRecordSet({
          recordSetTable: tables.RecordSet.label,
        })}
      </Button.Small>
      {state.type === 'Editing' && (
        <ResourceView
          dialog="modal"
          isDependent={false}
          isSubForm={false}
          resource={state.recordSet}
          viewName={recordSetView}
          onAdd={undefined}
          onClose={(): void => setState({ type: 'Main' })}
          onDeleted={f.never}
          onSaved={f.never}
          onSaving={(): false => {
            setState({ type: 'Saving' });
            createResource('RecordSet', {
              ...serializeResource(state.recordSet),
              version: 1,
              type: 0,
              dbTableId: strictGetTable(baseTableName).tableId,
              /*
               * Back-end has an exception for RecordSet table allowing passing
               * inline data for record set items.
               * Need to make IDs unique as query may return results with
               * duplicate IDs (when displaying a -to-many relationship)
               */
              // @ts-expect-error
              recordSetItems: f.unique(getIds()).map((id) => ({
                recordId: id,
              })),
            })
              .then((recordSet) =>
                setState({
                  type: 'Saved',
                  recordSet: deserializeResource(recordSet),
                })
              )
              .catch((error) => {
                setState({ type: 'Main' });
                raise(error);
              });
            return false;
          }}
        />
      )}
      {state.type === 'Saving' && recordSetFromQueryLoading()}
      {state.type === 'Saved' && (
        <RecordSetCreated
          recordSet={state.recordSet}
          onClose={(): void => setState({ type: 'Main' })}
        />
      )}
    </>
  );
}
