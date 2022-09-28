import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined, overwriteReadOnly } from '../../utils/types';
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
import { getModelById } from '../DataModel/schema';
import type { RecordSet as RecordSetSchema } from '../DataModel/types';
import { crash } from '../Errors/Crash';
import type { FormMode } from '../FormParse';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { hasToolPermission } from '../Permissions/helpers';
import type { RecordSelectorProps } from './RecordSelector';
import { RecordSelectorFromIds } from './RecordSelectorFromIds';
import { EditRecordSet } from '../Toolbar/RecordSetEdit';

/** Fetch IDs of records in a record set at a given position */
const fetchItems = async (
  recordSetId: number,
  offset: number
): Promise<
  (ids: RA<number | undefined>) => {
    readonly ids: RA<number | undefined>;
    readonly totalCount: number;
  }
> =>
  fetchCollection('RecordSetItem', {
    limit: DEFAULT_FETCH_LIMIT,
    recordSet: recordSetId,
    orderBy: 'id',
    offset,
  }).then(({ records, totalCount }) => (ids: RA<number | undefined>) => ({
    totalCount,
    ids: records
      .map(({ recordId }, index) => [offset + index, recordId] as const)
      .reduce(
        (items, [order, recordId]) => {
          items[order] = recordId;
          return items;
        },

        ids.length === 0
          ? /*
             * Creating a sparse array of correct length here. Can't use
             * Array.from({ length: totalCount }) because it creates a dense array
             */
            /* eslint-disable-next-line unicorn/no-new-array */
            new Array(totalCount)
          : /*
             * A trivial slice to create a shallow copy. Can't use Array.from
             * because that decompresses a sparse array
             */
            ids.slice()
      ),
  }));

export function RecordSet<SCHEMA extends AnySchema>({
  recordSet,
  defaultResourceIndex = 0,
  dialog,
  mode,
  onClose: handleClose,
  canAddAnother,
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
  readonly defaultResourceIndex: number | undefined;
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly mode: FormMode;
  readonly onClose: () => void;
  readonly canAddAnother: boolean;
}): JSX.Element {
  const [items, setItems] = React.useState<
    | {
        readonly totalCount: number;
        /*
         * Caution, this array can be sparse
         * IDs is a sparse array because some record sets may have tens of
         * thousands of items), Also, an array with 40k elements in a React
         * State causes React DevTools to crash
         */
        readonly ids: RA<number | undefined>;
        readonly newResource: SpecifyResource<SCHEMA> | undefined;
        readonly index: number;
      }
    | undefined
  >(undefined);
  const defaultRecordSetState = {
    totalCount: 0,
    ids: [],
    newResource: undefined,
    index: defaultResourceIndex,
  };
  const { totalCount, ids, newResource, index } =
    items ?? defaultRecordSetState;

  // Fetch ID of record at current index
  const currentRecordId = ids[index];
  const previousIndex = React.useRef<number>(index);
  React.useEffect(() => {
    if (currentRecordId === undefined)
      fetchItems(
        recordSet.id,
        // If new index is smaller (i.e, going back), fetch previous 20 IDs
        clamp(
          0,
          previousIndex.current > index
            ? index - DEFAULT_FETCH_LIMIT + 1
            : index,
          totalCount
        )
      )
        .then((updateIds) =>
          setItems(
            ({ ids: oldIds, newResource, index } = defaultRecordSetState) => {
              const { totalCount, ids } = updateIds(oldIds);
              const model =
                totalCount === 0
                  ? getModelById(recordSet.get('dbTableId'))
                  : undefined;
              return {
                ids,
                totalCount,
                newResource:
                  newResource ??
                  (typeof model === 'object'
                    ? new model.Resource()
                    : undefined),
                index,
              };
            }
          )
        )
        .catch(crash);
    return (): void => {
      previousIndex.current = index;
    };
  }, [totalCount, currentRecordId, index, recordSet.id]);

  const loading = React.useContext(LoadingContext);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as
    | {
        readonly originalLocation?: Location;
        readonly itemIndex?: number;
      }
    | undefined;
  const originalLocation = state?.originalLocation;
  const itemIndex = state?.itemIndex;
  React.useEffect(
    () =>
      setItems((state) =>
        state?.index === itemIndex || itemIndex === undefined
          ? state
          : {
              ...defaultRecordSetState,
              ...state,
              index: itemIndex,
            }
      ),
    [itemIndex]
  );
  /** Change the URL without changing the rendered component */
  const softNavigate = (url: string, itemIndex: number | undefined): void =>
    navigate(url, {
      state: {
        type: 'NoopRoute',
        originalLocation: originalLocation ?? location,
        itemIndex,
      },
    });

  const [hasDuplicate, handleHasDuplicate, handleDismissDuplicate] =
    useBooleanState();
  const handleAdd = (resources: RA<SpecifyResource<SCHEMA>>): void =>
    setItems(({ totalCount, ids } = defaultRecordSetState) => {
      loading(
        Promise.all(
          resources.map((resource) => {
            // If resource is not yet in a context of a record set, make it
            if (resource.recordsetid !== recordSet.id) {
              overwriteReadOnly(resource, 'recordsetid', recordSet.id);
              /*
               * For new resources, RecordSetItem would be created by the
               * back-end on save. For existing resources have to do that
               * manually
               */
              return resource.isNew()
                ? undefined
                : createResource('RecordSetItem', {
                    recordId: resource.id,
                    recordSet: recordSet.get('resource_uri'),
                  });
            } else return undefined;
          })
        )
      );
      const hasNew = resources.some((resource) => resource.isNew());
      if (hasNew && resources.length > 1)
        throw new Error("Can't add multiple new resources at once");
      softNavigate(resources[0].viewUrl(), hasNew ? undefined : ids.length);
      return {
        totalCount: totalCount + 1,
        ids: hasNew ? ids : [...ids, ...resources.map(({ id }) => id)],
        newResource: hasNew ? resources[0] : undefined,
        index: totalCount,
      };
    });

  return totalCount === 0 && newResource === undefined ? (
    <LoadingScreen />
  ) : (
    <>
      <RecordSelectorFromIds<SCHEMA>
        {...rest}
        canAddAnother={canAddAnother}
        defaultIndex={index}
        dialog={dialog}
        headerButtons={<EditRecordSetButton recordSet={recordSet} />}
        ids={ids}
        isDependent={false}
        mode={mode}
        newResource={newResource}
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
        onClose={handleClose}
        onDelete={
          (recordSet.isNew() || hasToolPermission('recordSets', 'delete')) &&
          (newResource === undefined || totalCount !== 0)
            ? (_index, source): void => {
                if (typeof newResource === 'object')
                  setItems({ totalCount, ids, newResource: undefined, index });
                else
                  loading(
                    (source === 'minusButton'
                      ? fetchCollection('RecordSetItem', {
                          limit: 1,
                          recordId: ids[index],
                          recordSet: recordSet.id,
                        }).then(async ({ records }) =>
                          deleteResource(
                            'RecordSetItem',
                            defined(
                              records[0],
                              `Failed to remove resource from the ` +
                              `record set. RecordSetItem not found. RecordId: ` +
                              `${ids[index]}. Record set: ${recordSet.id}`
                            ).id
                          )
                        )
                      : Promise.resolve()
                    ).then(() => {
                      setItems({
                        totalCount: totalCount - 1,
                        ids: removeItem(ids, index),
                        newResource: undefined,
                        index: clamp(
                          0,
                          /*
                           * Previous index decides which direction to go in
                           * once item is deleted
                           */
                          previousIndex.current > index
                            ? Math.max(0, index - 1)
                            : index,
                          totalCount - 2
                        ),
                      });
                      if (totalCount === 1) handleClose();
                    })
                  );
              }
            : undefined
        }
        onSaved={({ newResource, wasNew, resource }): void => {
          if (wasNew) {
            handleAdd([resource]);
          }
          if (typeof newResource === 'object') handleAdd([newResource]);
        }}
        onSlide={(index): void => {
          softNavigate(
            getResourceViewUrl(rest.model.name, ids[index], recordSet.id),
            index
          );
          setItems({
            totalCount,
            ids,
            newResource: undefined,
            index: Math.min(index, totalCount - 1),
          });
        }}
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
