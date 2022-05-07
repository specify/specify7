import React from 'react';
import type { State } from 'typesafe-reducer';

import { fetchCollection } from '../collection';
import type { RecordSet } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { hasToolPermission } from '../permissions';
import { getResourceViewUrl } from '../resource';
import { getModelById, schema } from '../schema';
import type { RA } from '../types';
import { userInformation } from '../userinfo';
import { Button, className, DataEntry, Link } from './basic';
import { TableIcon } from './common';
import { FormsDialog } from './formsdialog';
import { useAsyncState } from './hooks';
import { icons } from './icons';
import { formatNumber } from './internationalization';
import { Dialog } from './modaldialog';
import { goTo } from './navigation';
import { deserializeResource } from './resource';
import { ResourceView } from './resourceview';
import { QueryToolbarItem } from './toolbar/query';

function Row({
  recordSet,
  onSelect: handleSelect,
  onEdit: handleEdit,
}: {
  readonly recordSet: SerializedResource<RecordSet>;
  readonly onSelect?: () => void;
  readonly onEdit?: () => void;
}): JSX.Element | null {
  const [count] = useAsyncState(
    React.useCallback(
      async () =>
        fetchCollection('RecordSetItem', {
          limit: 1,
          recordSet: recordSet.id,
        }).then(({ totalCount }) => totalCount),
      [recordSet]
    ),
    false
  );

  return (
    <tr key={recordSet.id}>
      <td>
        <Link.Default
          href={`/specify/recordset/${recordSet.id}/`}
          className={
            typeof handleSelect === 'function'
              ? className.navigationHandled
              : undefined
          }
          title={recordSet.remarks ?? undefined}
          onClick={
            typeof handleSelect === 'function'
              ? (event): void => {
                  event.preventDefault();
                  handleSelect?.();
                }
              : undefined
          }
        >
          <TableIcon name={getModelById(recordSet.dbTableId).name} />
          {recordSet.name}
        </Link.Default>
      </td>
      <td
        title={commonText('recordCount')}
        aria-label={count?.toString()}
        className="tabular-nums justify-end"
      >
        {typeof count === 'number' ? `(${formatNumber(count)})` : undefined}
      </td>
      <td>
        {typeof handleEdit === 'function' && (
          <DataEntry.Edit onClick={handleEdit} />
        )}
      </td>
    </tr>
  );
}

export function RecordSetsDialog({
  recordSetsPromise,
  onClose: handleClose,
  isReadOnly,
  onSelect: handleSelect,
  children = ({ children, dialog }) => dialog(children),
}: {
  readonly recordSetsPromise: Promise<{
    readonly totalCount: number;
    readonly records: RA<SerializedResource<RecordSet>>;
  }>;
  readonly onClose: () => void;
  readonly isReadOnly: boolean;
  readonly onSelect?: (recordSet: SerializedResource<RecordSet>) => void;
  readonly children?: (props: {
    readonly totalCount: number;
    readonly records: RA<SerializedResource<RecordSet>>;
    readonly children: JSX.Element;
    readonly dialog: (
      children: JSX.Element,
      buttons?: JSX.Element
    ) => JSX.Element;
  }) => JSX.Element;
}): JSX.Element | null {
  const [data] = useAsyncState(
    React.useCallback(async () => recordSetsPromise, [recordSetsPromise]),
    true
  );

  const [state, setState] = React.useState<
    | State<'MainState'>
    | State<'CreateState'>
    | State<'EditState', { recordSet: SpecifyResource<RecordSet> }>
    | State<'QueryState', { recordSet: SpecifyResource<RecordSet> }>
  >({ type: 'MainState' });

  return typeof data === 'object' ? (
    state.type === 'MainState' ? (
      children({
        ...data,
        children: (
          <table className="grid-table grid-cols-[1fr_min-content_min-content] gap-2">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">{commonText('recordSet')}</span>
                </th>
                <th scope="col">
                  <span className="sr-only">{commonText('size')}</span>
                </th>
                <td />
              </tr>
            </thead>
            <tbody>
              {data.records.map((recordSet) => (
                <Row
                  recordSet={recordSet}
                  onSelect={
                    typeof handleSelect === 'function'
                      ? (): void => handleSelect(recordSet)
                      : undefined
                  }
                  onEdit={
                    isReadOnly
                      ? undefined
                      : (): void =>
                          setState({
                            type: 'EditState',
                            recordSet: deserializeResource(recordSet),
                          })
                  }
                  key={recordSet.id}
                />
              ))}
              {data.totalCount !== data.records.length && (
                <tr>
                  <td colSpan={3}>{commonText('listTruncated')}</td>
                </tr>
              )}
            </tbody>
          </table>
        ),
        dialog: (children, buttons) => (
          <Dialog
            icon={<span className="text-blue-500">{icons.collection}</span>}
            header={formsText('recordSetsDialogTitle', data.totalCount)}
            onClose={handleClose}
            buttons={
              <>
                <Button.DialogClose>{commonText('close')}</Button.DialogClose>
                {!isReadOnly && hasToolPermission('recordSets', 'create') && (
                  <Button.Blue
                    onClick={(): void => setState({ type: 'CreateState' })}
                  >
                    {commonText('new')}
                  </Button.Blue>
                )}
                {buttons}
              </>
            }
          >
            {children}
          </Dialog>
        ),
      })
    ) : state.type === 'CreateState' ? (
      <FormsDialog
        onClose={handleClose}
        onSelected={(model): void =>
          setState({
            type: 'EditState',
            recordSet: new schema.models.RecordSet.Resource()
              .set('dbTableId', model.tableId)
              .set('type', 0),
          })
        }
      />
    ) : state.type === 'EditState' ? (
      <ResourceView
        dialog="modal"
        resource={state.recordSet}
        mode={
          isReadOnly ||
          (!state.recordSet.isNew() &&
            !hasToolPermission('recordSets', 'update'))
            ? 'view'
            : 'edit'
        }
        onDeleted={undefined}
        onSaved={(): void =>
          goTo(
            getResourceViewUrl(
              getModelById(state.recordSet.get('dbTableId')).name,
              state.recordSet.id
            )
          )
        }
        onClose={handleClose}
        deletionMessage={formsText(
          'recordSetDeletionWarning',
          state.recordSet.get('name')
        )}
        canAddAnother={false}
        isSubForm={false}
        extraButtons={
          hasToolPermission('queryBuilder', 'read') &&
          !state.recordSet.isNew() ? (
            <>
              <span className="flex-1 -ml-2" />
              <Button.Blue
                onClick={(): void =>
                  setState({
                    type: 'QueryState',
                    recordSet: state.recordSet,
                  })
                }
              >
                {commonText('query')}
              </Button.Blue>
            </>
          ) : undefined
        }
        isDependent={false}
      />
    ) : state.type === 'QueryState' ? (
      <QueryToolbarItem
        isReadOnly={isReadOnly}
        onClose={handleClose}
        getQuerySelectUrl={(query): string =>
          `/specify/query/${query.id}/?recordsetid=${state.recordSet.id}`
        }
        spQueryFilter={{
          specifyUser: userInformation.id,
          contextTableId: state.recordSet.get('dbTableId'),
        }}
        onNewQuery={(): void =>
          goTo(
            `/specify/query/new/${getModelById(
              state.recordSet.get('dbTableId')
            ).name.toLowerCase()}/?recordsetid=${state.recordSet.id}`
          )
        }
      />
    ) : null
  ) : null;
}
