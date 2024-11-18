import React from 'react';
import type { State } from 'typesafe-reducer';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { Input } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { formatNumber } from '../Atoms/Internationalization';
import { Link } from '../Atoms/Link';
import { ReadOnlyContext } from '../Core/Contexts';
import { FormsDialog } from '../DataEntryTables';
import { fetchCollection } from '../DataModel/collection';
import { getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import { deserializeResource } from '../DataModel/serializers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTableById, tables } from '../DataModel/tables';
import type { RecordSet } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { loadingGif } from '../Molecules';
import { DateElement } from '../Molecules/DateElement';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { usePaginator } from '../Molecules/Paginator';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import { TableIcon } from '../Molecules/TableIcon';
import { hasToolPermission } from '../Permissions/helpers';
import { OverlayContext } from '../Router/Router';
import { DialogListSkeleton } from '../SkeletonLoaders/DialogList';
import { MergeRecordSets } from './MergeRecordSets';
import { EditRecordSet } from './RecordSetEdit';

export function RecordSetsOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  return <RecordSetsDialog onClose={handleClose} />;
}

type Renderer = (props: {
  readonly totalCount: number;
  readonly records: RA<SerializedResource<RecordSet>> | undefined;
  readonly children: JSX.Element;
  readonly dialog: (
    children: JSX.Element,
    buttons?: JSX.Element
  ) => JSX.Element;
}) => JSX.Element;

const defaultRenderer: Renderer = ({ children, dialog }): JSX.Element =>
  dialog(children);

export function RecordSetsDialog({
  onClose: handleClose,
  table,
  onConfigure: handleConfigure,
  onSelect: handleSelect,
  children = defaultRenderer,
}: {
  readonly onClose: () => void;
  readonly table?: SpecifyTable;
  readonly onConfigure?: (recordSet: SerializedResource<RecordSet>) => void;
  readonly onSelect?: (recordSet: SerializedResource<RecordSet>) => void;
  readonly children?: Renderer;
}): JSX.Element | null {
  const [state, setState] = React.useState<
    | State<'CreateState'>
    | State<'EditState', { readonly recordSet: SpecifyResource<RecordSet> }>
    | State<'MainState'>
  >({ type: 'MainState' });

  const [sortConfig, handleSort] = useSortConfig('listOfRecordSets', 'name');

  const { paginator, limit, offset } = usePaginator('recordSets');

  const orderBy = `${sortConfig.ascending ? '' : '-'}${
    sortConfig.sortField
  }` as const;

  const [data] = useAsyncState(
    React.useCallback(
      /**
       * DomainFilter does filter for tables that are
       * scoped using the collectionMemberId field
       */
      async () =>
        fetchCollection('RecordSet', {
          specifyUser: userInformation.id,
          type: 0,
          limit,
          domainFilter: true,
          orderBy,
          offset,
          dbTableId: table?.tableId,
          collectionMemberId: schema.domainLevelIds.collection,
        }),
      [table, limit, offset, orderBy]
    ),
    false
  );

  const totalCountRef = React.useRef<number | undefined>(undefined);
  totalCountRef.current = data?.totalCount ?? totalCountRef.current;
  const totalCount = totalCountRef.current;

  const isReadOnly = React.useContext(ReadOnlyContext);

  return totalCount === undefined ? (
    <LoadingScreen />
  ) : state.type === 'MainState' ? (
    children({
      totalCount,
      records: data?.records,
      children: (
        <>
          <table className="grid-table grid-cols-[1fr_auto_min-content_min-content] gap-2">
            <thead>
              <tr>
                <th scope="col">
                  <Button.LikeLink onClick={(): void => handleSort('name')}>
                    {tables.RecordSet.label}
                    <SortIndicator fieldName="name" sortConfig={sortConfig} />
                  </Button.LikeLink>
                </th>
                <th scope="col">
                  <Button.LikeLink
                    onClick={(): void => handleSort('timestampCreated')}
                  >
                    {getField(tables.RecordSet, 'timestampCreated').label}
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
              {data?.records.map((recordSet) => (
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
            </tbody>
          </table>
          <span className="-mt-2 flex-1" />
          {data === undefined && loadingGif}
          {data !== undefined && data.records.length > 0
            ? paginator(data?.totalCount)
            : null}
        </>
      ),
      dialog: (children, buttons) => (
        <Dialog
          buttons={
            <>
              {!isReadOnly && hasToolPermission('recordSets', 'create') && (
                <MergeRecordSets recordSets={data?.records} />
              )}
              <span className="-ml-2 flex-1" />
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              {!isReadOnly && hasToolPermission('recordSets', 'create') && (
                <Button.Info
                  onClick={(): void => setState({ type: 'CreateState' })}
                >
                  {commonText.new()}
                </Button.Info>
              )}
              {buttons}
            </>
          }
          dimensionsKey="RecordSets"
          header={commonText.countLine({
            resource: commonText.recordSets(),
            count: totalCount,
          })}
          icon={icons.collection}
          onClose={handleClose}
        >
          {children}
        </Dialog>
      ),
    })
  ) : state.type === 'CreateState' ? (
    <FormsDialog
      onClose={handleClose}
      onSelected={(table): void =>
        setState({
          type: 'EditState',
          recordSet: new tables.RecordSet.Resource()
            .set('dbTableId', table.tableId)
            .set('type', 0),
        })
      }
    />
  ) : state.type === 'EditState' ? (
    <EditRecordSet recordSet={state.recordSet} onClose={handleClose} />
  ) : (
    <Dialog
      buttons={<Button.DialogClose>{commonText.cancel()}</Button.DialogClose>}
      header={commonText.recordSets()}
      icon={icons.collection}
      onClose={handleClose}
    >
      <DialogListSkeleton />
    </Dialog>
  );
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
          domainFilter: false,
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
          title={localized(recordSet.remarks) ?? undefined}
          onClick={
            typeof handleSelect === 'function'
              ? (event): void => {
                  event.preventDefault();
                  handleSelect?.();
                }
              : undefined
          }
        >
          <TableIcon label name={getTableById(recordSet.dbTableId).name} />
          {localized(recordSet.name)}
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
