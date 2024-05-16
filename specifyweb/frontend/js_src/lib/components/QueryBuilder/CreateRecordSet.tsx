import React from 'react';
import type { State } from 'typesafe-reducer';

import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { createResource } from '../DataModel/resource';
import {
  deserializeResource,
  serializeResource,
} from '../DataModel/serializers';
import { strictGetTable, tables } from '../DataModel/tables';
import type { RecordSet, Tables } from '../DataModel/types';
import { raise } from '../Errors/Crash';
import { recordSetView } from '../FormParse/webOnlyViews';
import { ResourceView } from '../Forms/ResourceView';
import { loadingBar } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';
import { RecordSetCreated } from './Components';

/**
 * Renders a button to creates a record set from a group of records.
 * See also `MakeRecordSetButton`
 */
export function CreateRecordSet({
  recordIds,
  baseTableName,
  defaultRecordSetName,
  buttonType = 'Small',
  saveComponent,
}: {
  readonly recordIds: RA<number> | (() => RA<number>);
  readonly baseTableName: keyof Tables;
  readonly defaultRecordSetName?: string;
  readonly buttonType?: Exclude<keyof typeof Button, 'Icon'>;
  readonly saveComponent?: () => JSX.Element;
}): JSX.Element {
  const [state, setState] = React.useState<
    | State<'Editing', { readonly recordSet: SpecifyResource<RecordSet> }>
    | State<'Main'>
    | State<'Saved', { readonly recordSet: SpecifyResource<RecordSet> }>
    | State<'Saving'>
  >({ type: 'Main' });

  const resolvedRecordIds = React.useMemo(
    () => (typeof recordIds === 'function' ? recordIds() : recordIds),
    [recordIds]
  );

  const ResolvedButton = Button[buttonType];

  return (
    <>
      <ResolvedButton
        aria-haspopup="dialog"
        onClick={(): void => {
          const recordSet = new tables.RecordSet.Resource();
          if (defaultRecordSetName !== undefined)
            recordSet.set('name', defaultRecordSetName);
          setState({
            type: 'Editing',
            recordSet,
          });
        }}
      >
        {queryText.createRecordSet({
          recordSetTable: tables.RecordSet.label,
        })}
      </ResolvedButton>
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
              recordSetItems: f.unique(resolvedRecordIds).map((id) => ({
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
      {state.type === 'Saving'
        ? typeof saveComponent === 'function'
          ? saveComponent()
          : LoadingDialog()
        : null}
      {state.type === 'Saved' && (
        <RecordSetCreated
          recordSet={state.recordSet}
          onClose={(): void => setState({ type: 'Main' })}
        />
      )}
    </>
  );
}

function LoadingDialog(): JSX.Element {
  return (
    <Dialog
      buttons={undefined}
      header={queryText.recordSetToQueryDescription({
        recordSetTable: tables.RecordSet.label,
      })}
      onClose={undefined}
    >
      {loadingBar}
    </Dialog>
  );
}
