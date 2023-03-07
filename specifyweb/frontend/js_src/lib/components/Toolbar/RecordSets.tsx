import React from 'react';
import type { State } from 'typesafe-reducer';

import { useAsyncState, usePromise } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { icons } from '../Atoms/Icons';
import { formatNumber } from '../Atoms/Internationalization';
import { Link } from '../Atoms/Link';
import { fetchCollection } from '../DataModel/collection';
import { deserializeResource, getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getModelById, schema } from '../DataModel/schema';
import type { RecordSet } from '../DataModel/types';
import { FormsDialog } from '../Header/Forms';
import { userInformation } from '../InitialContext/userInformation';
import { DateElement } from '../Molecules/DateElement';
import { Dialog } from '../Molecules/Dialog';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import { TableIcon } from '../Molecules/TableIcon';
import { hasToolPermission } from '../Permissions/helpers';
import { OverlayContext } from '../Router/Router';
import { EditRecordSet } from './RecordSetEdit';

export function RecordSetsOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);

  const recordSetsPromise = React.useMemo(
    async () =>
      fetchCollection('RecordSet', {
        specifyUser: userInformation.id,
        type: 0,
        limit: 5000,
        domainFilter: true,
        orderBy: '-timestampCreated',
      }),
    []
  );
  return (
    <RecordSetsDialog
      isReadOnly={false}
      recordSetsPromise={recordSetsPromise}
      onClose={handleClose}
    />
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
    | State<'CreateState'>
    | State<'EditState', { readonly recordSet: SpecifyResource<RecordSet> }>
    | State<'MainState'>
  >({ type: 'MainState' });

  const [sortConfig, handleSort, applySortConfig] = useSortConfig(
    'listOfRecordSets',
    'name'
  );

  const [unsortedData] = usePromise(recordSetsPromise, true);
  const data = React.useMemo(
    () =>
      typeof unsortedData === 'object'
        ? {
            ...unsortedData,
            records: applySortConfig(
              unsortedData.records,
              (recordSet) => recordSet[sortConfig.sortField]
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
                    {schema.models.RecordSet.label}
                    <SortIndicator fieldName="name" sortConfig={sortConfig} />
                  </Button.LikeLink>
                </th>
                <th scope="col">
                  <Button.LikeLink
                    onClick={(): void => handleSort('timestampCreated')}
                  >
                    {
                      getField(schema.models.RecordSet, 'timestampCreated')
                        .label
                    }
                    <SortIndicator
                      fieldName="timestampCreated"
                      sortConfig={sortConfig}
                    />
                  </Button.LikeLink>
                </th>
                <th scope="col">{commonText.size()}</th>
                <td />
              </tr>
            </thead>
            <tbody>
              {data.records.map((recordSet) => (
                <Row
                  key={recordSet.id}
                  recordSet={recordSet}
                  onConfigure={handleConfigure?.bind(undefined, recordSet)}
                  onEdit={
                    isReadOnly
                      ? undefined
                      : (): void =>
                          setState({
                            type: 'EditState',
                            recordSet: deserializeResource(recordSet),
                          })
                  }
                  onSelect={
                    typeof handleSelect === 'function'
                      ? (): void => handleSelect(recordSet)
                      : undefined
                  }
                />
              ))}
              {data.totalCount !== data.records.length && (
                <tr>
                  <td colSpan={3}>{commonText.listTruncated()}</td>
                </tr>
              )}
            </tbody>
          </table>
        ),
        dialog: (children, buttons) => (
          <Dialog
            buttons={
              <>
                <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
                {!isReadOnly && hasToolPermission('recordSets', 'create') && (
                  <Button.Blue
                    onClick={(): void => setState({ type: 'CreateState' })}
                  >
                    {commonText.new()}
                  </Button.Blue>
                )}
                {buttons}
              </>
            }
            dimensionsKey="RecordSets"
            header={commonText.countLine({
              resource: commonText.recordSets(),
              count: data.totalCount,
            })}
            icon={<span className="text-blue-500">{icons.collection}</span>}
            onClose={handleClose}
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
      <EditRecordSet
        isReadOnly={isReadOnly}
        recordSet={state.recordSet}
        onClose={handleClose}
      />
    ) : null
  ) : null;
}

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
          href={`/specify/record-set/${recordSet.id}/`}
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
          <TableIcon label name={getModelById(recordSet.dbTableId).name} />
          {recordSet.name}
        </Link.Default>
      </td>
      <td>
        <DateElement date={recordSet.timestampCreated} />
      </td>
      <td className="justify-end tabular-nums" title={commonText.recordCount()}>
        {typeof count === 'number' ? `(${formatNumber(count)})` : undefined}
      </td>
      <td>
        {typeof handleEdit === 'function' && (
          <DataEntry.Edit onClick={handleEdit} />
        )}
        {typeof handleConfigure === 'function' && (
          <Button.Icon
            icon="cog"
            title={commonText.edit()}
            onClick={handleConfigure}
          />
        )}
      </td>
    </tr>
  );
}
