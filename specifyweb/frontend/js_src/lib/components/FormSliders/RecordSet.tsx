import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { fetchRows } from '../../utils/ajax/specifyApi';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { clamp, removeItem } from '../../utils/utils';
import { DataEntry } from '../Atoms/DataEntry';
import { LoadingContext } from '../Core/Contexts';
import { DEFAULT_FETCH_LIMIT, fetchCollection } from '../DataModel/collection';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import {
  createResource,
  deleteResource,
  getResourceViewUrl,
} from '../DataModel/resource';
import type { RecordSet as RecordSetSchema } from '../DataModel/types';
import type { FormMode } from '../FormParse';
import { Dialog } from '../Molecules/Dialog';
import { hasToolPermission } from '../Permissions/helpers';
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
  const state = (location.state ?? {}) as {
    readonly recordSetItemIndex?: number;
  };
  const savedRecordSetItemIndex = state?.recordSetItemIndex;
  const [recordSetItemIndex] = useAsyncState(
    React.useCallback(async () => {
      if (typeof savedRecordSetItemIndex === 'number')
        return savedRecordSetItemIndex;
      // FIXME: check if this should be equal to totalCount
      if (resource.isNew()) return 0;
      const { records } = await fetchCollection('RecordSetItem', {
        recordSet: recordSet.id,
        limit: 1,
        recordId: resource.id,
      });
      const recordSetItemId = records[0]?.id;
      if (recordSetItemId === undefined) {
        navigate(getResourceViewUrl(resource.specifyModel.name, resource.id));
        return undefined;
      }
      const { totalCount } = await fetchCollection(
        'RecordSetItem',
        {
          recordSet: recordSet.id,
          limit: 1,
        },
        { id__lt: recordSetItemId }
      );
      return totalCount;
    }, [savedRecordSetItemIndex, recordSet.id, resource.id]),
    true
  );

  const [totalCount] = useAsyncState(
    React.useCallback(
      async () =>
        fetchCollection('RecordSetItem', {
          limit: 1,
          recordSet: recordSet.id,
        }).then(({ totalCount }) => totalCount),
      [recordSet.id]
    ),
    true
  );

  return totalCount === undefined || recordSetItemIndex === undefined ? null : (
    <RecordSet
      dialog={false}
      index={recordSetItemIndex}
      mode="edit"
      model={resource.specifyModel}
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
): Promise<(ids: RA<number | undefined>) => RA<number | undefined>> =>
  fetchRows('RecordSetItem', {
    limit: fetchSize,
    recordSet: recordSetId,
    orderBy: 'id',
    offset,
    fields: { recordId: ['number'] } as const,
  }).then(
    (records) => (ids: RA<number | undefined>) =>
      records
        .map(({ recordId }, index) => [offset + index, recordId] as const)
        .reduce(
          (items, [order, recordId]) => {
            items[order] = recordId;
            return items;
          },
          /*
           * A trivial slice to create a shallow copy. Can't use Array.from
           * because that decompresses the sparse array
           */
          ids.slice()
        )
  );

function RecordSet<SCHEMA extends AnySchema>({
  recordSet,
  index: currentIndex,
  record: currentRecord,
  totalCount: initialTotalCount,
  dialog,
  mode,
  onClose: handleClose,
  ...rest
}: Omit<
  RecordSelectorProps<SCHEMA>,
  | 'children'
  | 'defaultIndex'
  | 'field'
  | 'index'
  | 'onDelete'
  | 'onSaved'
  | 'records'
  | 'totalCount'
> & {
  readonly recordSet: SpecifyResource<RecordSetSchema>;
  readonly index: number;
  readonly record: SpecifyResource<SCHEMA>;
  readonly totalCount: number;
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly mode: FormMode;
  readonly onClose: () => void;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const navigate = useNavigate();

  const [totalCount, setTotalCount] = React.useState<number>(initialTotalCount);
  const [ids = [], setIds] = React.useState<
    /*
     * Caution, this array can be sparse
     * IDs is a sparse array because some record sets may have tens of
     * thousands of items), Also, an array with 40k elements in a React
     * State causes React DevTools to crash
     */
    RA<number | undefined> | undefined
  >(undefined);

  const go = (
    index: number,
    recordId: number | undefined,
    newResource?: SpecifyResource<SCHEMA>
  ): void =>
    typeof recordId === 'number'
      ? navigate(
          getResourceViewUrl(
            currentRecord.specifyModel.name,
            recordId,
            recordSet.id
          ),
          {
            state: {
              recordSetItemIndex: index,
              resource: newResource,
            },
          }
        )
      : handleFetch(index);

  const previousIndex = React.useRef<number>(currentIndex);
  const handleFetch = React.useCallback(
    (index: number): void =>
      loading(
        fetchItems(
          recordSet.id,
          // If new index is smaller (i.e, going back), fetch previous 40 IDs
          clamp(
            0,
            previousIndex.current > index ? index - fetchSize + 1 : index,
            totalCount
          )
        ).then((updateIds) =>
          setIds((oldIds = []) => {
            const newIds = updateIds(oldIds);
            go(index, newIds[index]);
            return newIds;
          })
        )
      ),
    [totalCount, recordSet.id, loading]
  );

  // Fetch ID of record at current index
  const currentRecordId = ids[currentIndex];
  React.useEffect(() => {
    if (currentRecordId === undefined) handleFetch(currentIndex);
    return (): void => {
      previousIndex.current = currentIndex;
    };
  }, [totalCount, currentRecordId, handleFetch, currentIndex]);

  const [hasDuplicate, handleHasDuplicate, handleDismissDuplicate] =
    useBooleanState();
  const handleAdd = (resources: RA<SpecifyResource<SCHEMA>>): void => {
    const oldTotalCount = totalCount;
    setTotalCount(oldTotalCount + 1);
    loading(
      Promise.all(
        resources.map(async (resource) =>
          createResource('RecordSetItem', {
            recordId: resource.id,
            recordSet: recordSet.get('resource_uri'),
          })
        )
      )
    );
    go(oldTotalCount, resources[0].id, resources[0]);
    setIds([...ids, ...resources.map(({ id }) => id)]);
  };

  return (
    <>
      <RecordSelectorFromIds<SCHEMA>
        {...rest}
        defaultIndex={currentIndex}
        dialog={dialog}
        headerButtons={<EditRecordSetButton recordSet={recordSet} />}
        ids={ids}
        isDependent={false}
        mode={mode}
        newResource={currentRecord.isNew() ? currentRecord : undefined}
        title={`${commonText('recordSet')}: ${recordSet.get('name')}`}
        totalCount={totalCount}
        urlContext={recordSet.id}
        onAdd={
          hasToolPermission('recordSets', 'create')
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
                          }).then(({ totalCount }) => totalCount !== 0),
                    })
                  )
                ).then((results) => {
                  const hasDuplicate = results.some(
                    ({ isDuplicate }) => isDuplicate
                  );
                  if (hasDuplicate && results.length === 1)
                    handleHasDuplicate();
                  else {
                    const resources = results
                      .filter(({ isDuplicate }) => !isDuplicate)
                      .map(({ resource }) => resource);
                    handleAdd(resources);
                  }
                })
            : undefined
        }
        onClone={(newResource): void =>
          go(currentIndex + 1, undefined, newResource)
        }
        onClose={handleClose}
        onDelete={
          (recordSet.isNew() || hasToolPermission('recordSets', 'delete')) &&
          (!currentRecord.isNew() || totalCount !== 0)
            ? (_index, source): void => {
                if (currentRecord.isNew())
                  go(currentIndex - 1, ids[currentIndex - 1]);
                else
                  loading(
                    (source === 'minusButton'
                      ? fetchCollection('RecordSetItem', {
                          limit: 1,
                          recordId: ids[currentIndex],
                          recordSet: recordSet.id,
                        }).then(async ({ records }) =>
                          deleteResource(
                            'RecordSetItem',
                            defined(
                              records[0],
                              `Failed to remove resource from the ` +
                                `record set. RecordSetItem not found. RecordId: ` +
                                `${ids[currentIndex]}. Record set: ${recordSet.id}`
                            ).id
                          )
                        )
                      : Promise.resolve()
                    ).then(() => {
                      const newTotalCount = totalCount - 1;
                      setTotalCount(newTotalCount);
                      setIds(removeItem(ids, currentIndex));
                      const newIndex = clamp(
                        0,
                        /*
                         * Previous index decides which direction to go in
                         * once item is deleted
                         */
                        previousIndex.current > currentIndex
                          ? Math.max(0, currentIndex - 1)
                          : currentIndex,
                        newTotalCount - 1
                      );
                      go(ids[newIndex]!, newIndex);
                      if (newTotalCount === 0) handleClose();
                    })
                  );
              }
            : undefined
        }
        onSaved={(resource): void => handleAdd([resource])}
        onSlide={(index): void => go(index, ids[index])}
      />
      {hasDuplicate && (
        <Dialog
          buttons={commonText('close')}
          header={formsText('duplicateRecordSetItemDialogHeader')}
          onClose={handleDismissDuplicate}
        >
          {formsText('duplicateRecordSetItemDialogText')}
        </Dialog>
      )}
    </>
  );
}

function EditRecordSetButton({
  recordSet,
}: {
  readonly recordSet: SpecifyResource<RecordSetSchema>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <DataEntry.Edit onClick={handleOpen} />
      {isOpen && (
        <EditRecordSet
          isReadOnly={false}
          recordSet={recordSet}
          onClose={handleClose}
        />
      )}
    </>
  );
}
