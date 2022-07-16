import React from 'react';
import type { State } from 'typesafe-reducer';

import { fetchCollection } from '../collection';
import type { RecordSet } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { sortFunction } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { hasToolPermission } from '../permissionutils';
import { formatUrl } from '../querystring';
import { getResourceViewUrl } from '../resource';
import { getModelById, schema } from '../schema';
import type { RA } from '../types';
import { userInformation } from '../userinfo';
import { Button, className, DataEntry, Link } from './basic';
import { SortIndicator, TableIcon, useSortConfig } from './common';
import { FormsDialog } from './formsdialog';
import { useAsyncState, useBooleanState } from './hooks';
import { icons } from './icons';
import { DateElement, formatNumber } from './internationalization';
import { Dialog } from './modaldialog';
import { goTo } from './navigation';
import { deserializeResource } from './resource';
import { ResourceView } from './resourceview';
import { QueryToolbarItem } from './toolbar/query';

function Row({
  recordSet,
  onSelect: handleSelect,
  onConfigure: handleConfigure,
  onEdit: handleEdit,
}: {
  readonly recordSet: SerializedResource<RecordSet>;
  readonly onSelect?: () => void;
  readonly onConfigure?: () => void;
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
          <TableIcon name={getModelById(recordSet.dbTableId).name} label />
          {recordSet.name}
        </Link.Default>
      </td>
      <td>
        <DateElement date={recordSet.timestampCreated} />
      </td>
      <td
        title={commonText('recordCount')}
        className="tabular-nums justify-end"
      >
        {typeof count === 'number' ? `(${formatNumber(count)})` : undefined}
      </td>
      <td>
        {typeof handleEdit === 'function' && (
          <DataEntry.Edit onClick={handleEdit} />
        )}
        {typeof handleConfigure === 'function' && (
          <Button.Icon
            icon="cog"
            title={commonText('edit')}
            onClick={handleConfigure}
          />
        )}
      </td>
    </tr>
  );
}

export function RecordSetsDialog({
  recordSetsPromise,
  onClose: handleClose,
  isReadOnly,
  onConfigure: handleConfigure,
  onSelect: handleSelect,
  children = ({ children, dialog }): JSX.Element => dialog(children),
}: {
  readonly recordSetsPromise: Promise<{
    readonly totalCount: number;
    readonly records: RA<SerializedResource<RecordSet>>;
  }>;
  readonly onClose: () => void;
  readonly isReadOnly: boolean;
  readonly onConfigure?: (recordSet: SerializedResource<RecordSet>) => void;
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
  const [state, setState] = React.useState<
    | State<'MainState'>
    | State<'CreateState'>
    | State<'EditState', { recordSet: SpecifyResource<RecordSet> }>
  >({ type: 'MainState' });

  const [sortConfig, handleSort] = useSortConfig('listOfRecordSets', 'name');

  const [unsortedData] = useAsyncState(
    React.useCallback(async () => recordSetsPromise, [recordSetsPromise]),
    true
  );
  const data = React.useMemo(
    () =>
      typeof unsortedData === 'object'
        ? {
            ...unsortedData,
            records: Array.from(unsortedData.records).sort(
              sortFunction(
                (recordSet) => recordSet[sortConfig.sortField],
                !sortConfig.ascending
              )
            ),
          }
        : undefined,
    [unsortedData, sortConfig]
  );

  return typeof data === 'object' ? (
    state.type === 'MainState' ? (
      children({
        ...data,
        children: (
          <table className="grid-table grid-cols-[1fr_auto_min-content_min-content] gap-2">
            <thead>
              <tr>
                <th scope="col">
                  <Button.LikeLink onClick={(): void => handleSort('name')}>
                    {commonText('recordSet')}
                    <SortIndicator fieldName="name" sortConfig={sortConfig} />
                  </Button.LikeLink>
                </th>
                <th scope="col">
                  <Button.LikeLink
                    onClick={(): void => handleSort('timestampCreated')}
                  >
                    {commonText('created')}
                    <SortIndicator
                      fieldName="timestampCreated"
                      sortConfig={sortConfig}
                    />
                  </Button.LikeLink>
                </th>
                <th scope="col">{commonText('size')}</th>
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
                  onConfigure={handleConfigure?.bind(undefined, recordSet)}
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
                <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
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
    ) : (
      <EditRecordSet
        recordSet={state.recordSet}
        isReadOnly={isReadOnly}
        onClose={handleClose}
      />
    )
  ) : null;
}

export function EditRecordSet({
  recordSet,
  isReadOnly,
  onClose: handleClose,
}: {
  readonly recordSet: SpecifyResource<RecordSet>;
  readonly isReadOnly: boolean;
  readonly onClose: () => void;
}): JSX.Element {
  const [isQuerying, handleOpenQuery, handleCloseQuery] = useBooleanState();
  return isQuerying ? (
    <QueryRecordSet
      recordSet={recordSet}
      isReadOnly={isReadOnly}
      onClose={handleCloseQuery}
    />
  ) : (
    <ResourceView
      dialog="modal"
      resource={recordSet}
      mode={
        isReadOnly ||
        (!recordSet.isNew() && !hasToolPermission('recordSets', 'update'))
          ? 'view'
          : 'edit'
      }
      onDeleted={undefined}
      onSaved={(): void =>
        goTo(
          getResourceViewUrl(
            getModelById(recordSet.get('dbTableId')).name,
            undefined,
            recordSet.id
          )
        )
      }
      onClose={handleClose}
      deletionMessage={formsText(
        'recordSetDeletionWarning',
        recordSet.get('name')
      )}
      canAddAnother={false}
      isSubForm={false}
      extraButtons={
        hasToolPermission('queryBuilder', 'read') && !recordSet.isNew() ? (
          <>
            <span className="flex-1 -ml-2" />
            <Button.Blue onClick={handleOpenQuery}>
              {commonText('query')}
            </Button.Blue>
          </>
        ) : undefined
      }
      isDependent={false}
    />
  );
}

function QueryRecordSet({
  recordSet,
  isReadOnly,
  onClose: handleClose,
}: {
  readonly recordSet: SpecifyResource<RecordSet>;
  readonly isReadOnly: boolean;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <QueryToolbarItem
      isReadOnly={isReadOnly}
      onClose={handleClose}
      getQuerySelectUrl={(query): string =>
        formatUrl(`/specify/query/${query.id}/`, {
          recordSetId: recordSet.id.toString(),
        })
      }
      spQueryFilter={{
        specifyUser: userInformation.id,
        contextTableId: recordSet.get('dbTableId'),
      }}
      onNewQuery={(): void =>
        goTo(
          formatUrl(
            `/specify/query/new/${getModelById(
              recordSet.get('dbTableId')
            ).name.toLowerCase()}/`,
            { recordSetId: recordSet.id.toString() }
          )
        )
      }
    />
  );
}
