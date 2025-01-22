import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { clamp, sortFunction, split } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { LoadingContext } from '../Core/Contexts';
import {
  DEFAULT_FETCH_LIMIT,
  fetchCollection,
  fetchRows,
} from '../DataModel/collection';
import { backendFilter } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import {
  createResource,
  deleteResource,
  getResourceViewUrl,
} from '../DataModel/resource';
import { serializeResource } from '../DataModel/serializers';
import { tables } from '../DataModel/tables';
import type {
  CollectionObject,
  RecordSet as RecordSetSchema,
  Tables,
} from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { format } from '../Formatters/formatters';
import { recordSetView } from '../FormParse/webOnlyViews';
import { ResourceView } from '../Forms/ResourceView';
import { Dialog } from '../Molecules/Dialog';
import { hasToolPermission } from '../Permissions/helpers';
import { locationToState } from '../Router/RouterState';
import { EditRecordSet } from '../Toolbar/RecordSetEdit';
import type { RecordSelectorProps } from './RecordSelector';
import { RecordSelectorFromIds } from './RecordSelectorFromIds';

export function RecordSetWrapper<SCHEMA extends AnySchema>({
  recordSet,
  resource,
  onClose: handleClose,
}: {
  readonly recordSet: SpecifyResource<RecordSetSchema>;
  readonly resource: SpecifyResource<SCHEMA>;
  readonly onClose: () => void;
}): JSX.Element | null {
  const navigate = useNavigate();

  const location = useLocation();
  const state = locationToState(location, 'RecordSet');
  const savedRecordSetItemIndex = state?.recordSetItemIndex;
  const [index, setIndex] = React.useState<number | undefined>(undefined);
  const loading = React.useContext(LoadingContext);
  React.useEffect(() => {
    if (typeof savedRecordSetItemIndex === 'number') {
      setIndex(savedRecordSetItemIndex);
      return;
    }
    if (resource.isNew() || recordSet.isNew()) {
      setIndex(0);
      return;
    }

    loading(
      fetchCollection('RecordSetItem', {
        recordSet: recordSet.id,
        limit: 1,
        recordId: resource.id,
        domainFilter: false,
      }).then(async ({ records }) => {
        const recordSetItemId = records[0]?.id;
        if (recordSetItemId === undefined) {
          // Record is not part of a record set
          navigate(
            getResourceViewUrl(resource.specifyTable.name, resource.id),
            { replace: true }
          );
          return;
        }
        /*
         * Count how many record set items there are before this one.
         * That would be used as index.
         */
        const { totalCount } = await fetchCollection(
          'RecordSetItem',
          {
            recordSet: recordSet.id,
            limit: 1,
            domainFilter: false,
          },
          backendFilter('id').lessThan(recordSetItemId)
        );
        setIndex(totalCount);
      })
    );
  }, [savedRecordSetItemIndex, loading, recordSet.id, resource.id]);

  const [totalCount] = useAsyncState(
    React.useCallback(
      async () =>
        recordSet.isNew()
          ? resource.isNew()
            ? 0
            : 1
          : fetchCollection('RecordSetItem', {
              limit: 1,
              recordSet: recordSet.id,
              domainFilter: false,
            }).then(({ totalCount }) => totalCount),
      [recordSet.id]
    ),
    true
  );

  return totalCount === undefined || index === undefined ? null : (
    <RecordSet
      dialog={false}
      index={resource.isNew() ? totalCount : index}
      key={recordSet.cid}
      record={resource}
      recordSet={recordSet}
      totalCount={totalCount}
      onAdd={undefined}
      onClose={handleClose}
      onSlide={undefined}
    />
  );
}

const fetchSize = DEFAULT_FETCH_LIMIT * 2;

/** Fetch IDs of records in a record set at a given position */
const fetchItems = async (
  recordSetId: number,
  offset: number
): Promise<RA<readonly [index: number, id: number]>> =>
  fetchRows('RecordSetItem', {
    limit: fetchSize,
    domainFilter: false,
    recordSet: recordSetId,
    orderBy: 'id',
    offset,
    fields: { recordId: ['number'] } as const,
  }).then((records) =>
    records.map(({ recordId }, index) => [offset + index, recordId] as const)
  );

const updateIds = (
  oldIds: RA<number | undefined>,
  updates: RA<readonly [index: number, id: number]>
): RA<number | undefined> =>
  updates.reduce(
    (items, [order, recordId]) => {
      items[order] = recordId;
      return items;
    },
    /*
     * A trivial slice to create a shallow copy. Can't use Array.from
     * because that decompresses the sparse array
     */
    oldIds.slice()
  );

function RecordSet<SCHEMA extends AnySchema>({
  recordSet,
  index: currentIndex,
  record: currentRecord,
  totalCount: initialTotalCount,
  dialog,
  onClose: handleClose,
  ...rest
}: Omit<
  RecordSelectorProps<SCHEMA>,
  | 'defaultIndex'
  | 'field'
  | 'index'
  | 'onDelete'
  | 'onSaved'
  | 'records'
  | 'table'
> & {
  readonly recordSet: SpecifyResource<RecordSetSchema>;
  readonly index: number;
  readonly record: SpecifyResource<SCHEMA>;
  readonly totalCount: number;
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly onClose: () => void;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const navigate = useNavigate();

  const [ids = [], setIds] = React.useState<
    /*
     * Caution, this array can be sparse
     * IDs is a sparse array because some record sets may have tens of
     * thousands of items), Also, an array with 40k elements in a React
     * State causes React DevTools to crash
     */
    RA<number | undefined>
  >(() => {
    const array = [];
    if (initialTotalCount > 0) array[initialTotalCount - 1] = undefined;
    if (recordSet.isNew() && !currentRecord.isNew())
      array[0] = currentRecord.id;
    return array;
  });

  const go = (
    index: number,
    recordId: number | 'new' | undefined,
    newResource?: SpecifyResource<SCHEMA>,
    replace: boolean = false
  ): void =>
    recordId === undefined
      ? handleFetchMore(index)
      : navigate(
          getResourceViewUrl(
            currentRecord.specifyTable.name,
            recordId,
            recordSet.id
          ),
          {
            state: {
              type: 'RecordSet',
              recordSetItemIndex: index,
              resource: f.maybe(
                newResource as SpecifyResource<AnySchema>,
                serializeResource
              ),
            },
            replace,
          }
        );

  const previousIndex = React.useRef<number>(currentIndex);
  const [isLoading, handleLoading, handleLoaded] = useBooleanState();
  const totalCount = ids.length;
  const handleFetch = React.useCallback(
    async (index: number): Promise<RA<number | undefined> | undefined> => {
      if (index >= totalCount) return undefined;
      handleLoading();
      return fetchItems(
        recordSet.id,
        // If new index is smaller (i.e, going back), fetch previous 40 IDs
        clamp(
          0,
          previousIndex.current > index ? index - fetchSize + 1 : index,
          totalCount
        )
      ).then(
        async (updates) =>
          new Promise((resolve) =>
            setIds((oldIds = []) => {
              handleLoaded();
              const newIds = updateIds(oldIds, updates);
              resolve(newIds);
              return newIds;
            })
          )
      );
    },
    [totalCount, recordSet.id, loading, handleLoading, handleLoaded]
  );

  const handleFetchMore = React.useCallback(
    (index: number): void => {
      handleFetch(index)
        .then((newIds) => {
          if (newIds === undefined) return;
          go(index, newIds[index]);
        })
        .catch(softFail);
    },
    [handleFetch]
  );

  // Fetch ID of record at current index
  const currentRecordId = ids[currentIndex];
  React.useEffect(() => {
    if (currentRecordId === undefined) handleFetchMore(currentIndex);

    return (): void => {
      previousIndex.current = currentIndex;
    };
  }, [totalCount, currentRecordId, handleFetchMore, currentIndex]);

  const [hasDuplicate, handleHasDuplicate, handleDismissDuplicate] =
    useBooleanState();

  const [hasSeveralResourceType, setHasSeveralResourceType] =
    React.useState(false);
  const [resourceType, setResourceType] = React.useState<
    keyof Tables | undefined
  >(undefined);

  async function handleAdd(
    resources: RA<SpecifyResource<SCHEMA>>,
    wasNew: boolean
  ): Promise<void> {
    if (!recordSet.isNew())
      await addIdsToRecordSet(resources.map(({ id }) => id));
    go(totalCount, resources[0].id, undefined, wasNew);
    if (resourceType === undefined) {
      setResourceType(resources[0].specifyTable.name);
    } else if (resourceType !== resources.at(-1)?.specifyTable.name) {
      setHasSeveralResourceType(true);
      setResourceType(resources.at(-1)?.specifyTable.name);
    }
    setIds((oldIds = []) =>
      updateIds(
        oldIds,
        resources.map(({ id }, index) => [totalCount + index, id])
      )
    );
  }

  async function createNewRecordSet(
    ids: RA<number | undefined>
  ): Promise<void> {
    await recordSet.save();
    await addIdsToRecordSet(ids);
    navigate(`/specify/record-set/${recordSet.id}/`);
  }

  const addIdsToRecordSet = async (
    ids: RA<number | undefined>
  ): Promise<void> =>
    Promise.all(
      ids.map(async (recordId) =>
        recordId === undefined
          ? undefined
          : createResource('RecordSetItem', {
              recordId,
              recordSet: recordSet.get('resource_uri'),
            })
      )
    ).then(f.void);

  const [openDialogForTitle, _, __, setOpenDialogForTitle] =
    useBooleanState(false);

  return (
    <>
      <RecordSelectorFromIds<SCHEMA>
        {...rest}
        defaultIndex={currentIndex}
        dialog={dialog}
        hasSeveralResourceType={hasSeveralResourceType}
        headerButtons={
          recordSet.isNew() ? (
            ids.length > 1 &&
            !currentRecord.isNew() &&
            !hasSeveralResourceType ? (
              <Button.Icon
                icon="collection"
                title={formsText.createNewRecordSet()}
                onClick={(): void => setOpenDialogForTitle()}
              />
            ) : undefined
          ) : (
            <EditRecordSetButton recordSet={recordSet} />
          )
        }
        ids={ids}
        isDependent={false}
        isInRecordSet
        isLoading={isLoading}
        newResource={currentRecord.isNew() ? currentRecord : undefined}
        recordSetName={recordSet.isNew() ? undefined : recordSet.get('name')}
        table={currentRecord.specifyTable}
        title={
          recordSet.isNew()
            ? undefined
            : commonText.colonLine({
                label: tables.RecordSet.label,
                value: recordSet.get('name'),
              })
        }
        onAdd={
          hasToolPermission('recordSets', 'create') && !recordSet.isNew()
            ? async (resources) =>
                // Detect duplicate record set item
                Promise.all(
                  resources.map(async (resource) =>
                    f.all({
                      resource,
                      isDuplicate: resource.isNew()
                        ? Promise.resolve(false)
                        : fetchCollection('RecordSetItem', {
                            recordSet: recordSet.id,
                            recordId: resource.id,
                            limit: 1,
                            domainFilter: false,
                          }).then(({ totalCount }) => totalCount !== 0),
                    })
                  )
                ).then(async (results) => {
                  const [nonDuplicates, duplicates] = split(
                    results,
                    ({ isDuplicate }) => isDuplicate
                  );
                  if (duplicates.length > 0 && nonDuplicates.length === 0)
                    handleHasDuplicate();
                  else
                    return handleAdd(
                      nonDuplicates.map(({ resource }) => resource),
                      false
                    );
                  return undefined;
                })
            : undefined
        }
        onClone={(resources: RA<SpecifyResource<SCHEMA>>): void => {
          go(totalCount, 'new', resources[0]);
          if (resources.length > 1) {
            const sortedResources = Array.from(resources).sort(
              sortFunction((r) => r.id)
            ) as RA<SpecifyResource<CollectionObject>>;
            loading(
              createNewRecordSet(
                sortedResources.map((resource) => resource.id)
              ).then(async () => {
                const firstCollectionObject = await format(sortedResources[0]);
                const lastCollectionObject = await format(
                  sortedResources.at(-1)
                );
                recordSet.set(
                  'name',
                  `${
                    tables.CollectionObject.label
                  } Batch ${firstCollectionObject!} - ${lastCollectionObject!}`
                );
                await recordSet.save();
              })
            );
          }
        }}
        onClose={handleClose}
        onDelete={
          (recordSet.isNew() || hasToolPermission('recordSets', 'delete')) &&
          (!currentRecord.isNew() || totalCount !== 0) &&
          !recordSet.isNew()
            ? (_index, source): void => {
                if (currentRecord.isNew()) return;
                loading(
                  (source === 'minusButton'
                    ? fetchCollection('RecordSetItem', {
                        limit: 1,
                        recordId: ids[currentIndex],
                        recordSet: recordSet.id,
                        domainFilter: false,
                      }).then(async ({ records }) =>
                        deleteResource(
                          'RecordSetItem',
                          defined(
                            records[0],
                            `Failed to remove resource from the ` +
                              `record set. RecordSetItem not found. RecordId: ` +
                              `${ids[currentIndex] ?? 'null'}. Record set: ${
                                recordSet.id
                              }`
                          ).id
                        )
                      )
                    : Promise.resolve()
                  ).then(() =>
                    setIds((oldIds = []) => {
                      const newIds = oldIds.slice();
                      newIds.splice(currentIndex, 1);
                      if (newIds.length === 0) handleClose();
                      return newIds;
                    })
                  )
                );
              }
            : undefined
        }
        onFetch={handleFetch}
        onSaved={(resource): void =>
          // Don't do anything if saving existing resource
          ids[currentIndex] === resource.id
            ? undefined
            : loading(handleAdd([resource], true))
        }
        onSlide={(index, replace): void =>
          go(index, ids[index], undefined, replace)
        }
      />
      {hasDuplicate && (
        <Dialog
          buttons={commonText.close()}
          header={formsText.duplicateRecordSetItem({
            recordSetItemTable: tables.RecordSetItem.label,
          })}
          onClose={handleDismissDuplicate}
        >
          {formsText.duplicateRecordSetItemDescription({
            recordSetTable: tables.RecordSet.label,
          })}
        </Dialog>
      )}
      {openDialogForTitle ? (
        <ResourceView
          dialog="modal"
          isDependent={false}
          isSubForm={false}
          resource={recordSet}
          viewName={recordSetView}
          onAdd={undefined}
          onClose={(): void => setOpenDialogForTitle()}
          onDeleted={f.never}
          onSaved={(): void => loading(createNewRecordSet(ids))}
        />
      ) : null}
    </>
  );
}

function EditRecordSetButton({
  recordSet,
}: {
  readonly recordSet: SpecifyResource<RecordSetSchema>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const navigate = useNavigate();
  return (
    <>
      <DataEntry.Edit onClick={handleOpen} />
      {isOpen && (
        <EditRecordSet
          recordSet={recordSet}
          onClose={handleClose}
          onDeleted={(): void => navigate('/specify/')}
        />
      )}
    </>
  );
}
