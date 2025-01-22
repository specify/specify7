import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { unsetUnloadProtect } from '../../hooks/navigation';
import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { RA } from '../../utils/types';
import { removeItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { ChronoChart } from '../Attachments/ChronoChart';
import { RecordSetAttachments } from '../Attachments/RecordSetAttachment';
import { tablesWithAttachments } from '../Attachments/utils';
import { ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { tables } from '../DataModel/tables';
import { ResourceView } from '../Forms/ResourceView';
import { saveFormUnloadProtect } from '../Forms/Save';
import { Dialog } from '../Molecules/Dialog';
import { hasTablePermission } from '../Permissions/helpers';
import { SetUnloadProtectsContext } from '../Router/UnloadProtect';
import type { RecordSelectorProps } from './RecordSelector';
import { useRecordSelector } from './RecordSelector';

/**
 * A Wrapper for RecordSelector that allows to specify list of records by their
 * IDs
 */
export function RecordSelectorFromIds<SCHEMA extends AnySchema>({
  ids,
  newResource,
  onSlide: handleSlide,
  defaultIndex,
  table,
  viewName,
  recordSetName,
  title,
  headerButtons,
  dialog,
  isDependent,
  canRemove = true,
  totalCount = ids.length + (typeof newResource === 'object' ? 1 : 0),
  isLoading: isExternalLoading = false,
  isInRecordSet = false,
  onClose: handleClose,
  onSaved: handleSaved,
  onAdd: handleAdd,
  onClone: handleClone,
  onDelete: handleDelete,
  onFetch: handleFetch,
  hasSeveralResourceType,
  ...rest
}: Omit<RecordSelectorProps<SCHEMA>, 'index' | 'records'> & {
  /*
   * Undefined IDs are placeholders for items with unknown IDs (e.g in record
   * sets or query results with thousands of items)
   */
  readonly ids: RA<number | undefined>;
  readonly newResource: SpecifyResource<SCHEMA> | undefined;
  readonly recordSetName?: string | undefined;
  readonly title: LocalizedString | undefined;
  readonly headerButtons?: JSX.Element;
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly isDependent: boolean;
  readonly viewName?: string;
  readonly canRemove?: boolean;
  readonly totalCount?: number;
  readonly isLoading?: boolean;
  // Record set ID, or false to not update the URL
  readonly isInRecordSet?: boolean;
  readonly onClose: () => void;
  readonly onSaved: (resource: SpecifyResource<SCHEMA>) => void;
  readonly onClone:
    | ((resources: RA<SpecifyResource<SCHEMA>>) => void)
    | undefined;
  readonly onFetch?: (
    index: number
  ) => Promise<RA<number | undefined> | undefined>;
  readonly hasSeveralResourceType?: boolean;
}): JSX.Element | null {
  const [records, setRecords] = React.useState<
    RA<SpecifyResource<SCHEMA> | undefined>
  >(() =>
    ids.map((id) => (id === undefined ? undefined : new table.Resource({ id })))
  );

  const previousIds = React.useRef(ids);

  React.useEffect(() => {
    setRecords((records) =>
      ids.map((id, index) => {
        if (id === undefined) return undefined;
        else if (records[index]?.id === id) return records[index];
        else return new table.Resource({ id });
      })
    );

    return (): void => {
      previousIds.current = ids;
    };
  }, [ids, table]);

  const [rawIndex, setIndex] = useTriggerState(
    Math.max(0, defaultIndex ?? ids.length - 1)
  );
  const index =
    typeof newResource === 'object'
      ? totalCount - 1
      : Math.min(rawIndex, totalCount - 1);

  const currentResource = newResource ?? records[index];

  // Show a warning dialog if navigating away before saving the record
  const [unloadProtect, setUnloadProtect] = React.useState<
    (() => void) | undefined
  >(undefined);
  const setUnloadProtects = React.useContext(SetUnloadProtectsContext)!;

  const {
    dialogs,
    slider,
    resource,
    onAdd: handleAdding,
    onRemove: handleRemove,
    isLoading,
  } = useRecordSelector({
    ...rest,
    index,
    table,
    records:
      typeof newResource === 'object' ? [...records, newResource] : records,
    totalCount,
    onAdd:
      typeof handleAdd === 'function'
        ? (resources): void => {
            if (currentResource?.needsSaved === true)
              /*
               * Since React's setState has a special behavior when a function
               * argument is passed, need to wrap a function in a function
               */
              // eslint-disable-next-line unicorn/consistent-function-scoping
              setUnloadProtect(() => () => handleAdd(resources));
            else handleAdd(resources);
          }
        : undefined,
    onDelete:
      typeof handleDelete === 'function'
        ? (index, source): void => {
            handleDelete(index, source);
            setRecords(removeItem(records, index));
            if (ids.length === 1) handleClose();
          }
        : undefined,
    onSlide: (index, replace, callback): void => {
      function doSlide(): void {
        setIndex(index);
        handleSlide?.(index, replace);
        callback?.();
      }

      if (
        currentResource?.needsSaved === true ||
        /*
         * If adding new resource that hasn't yet been modified, show a
         * warning anyway because navigating away before saving in a
         * RecordSet cancels the record adding process
         */
        currentResource?.isNew() === true
      )
        setUnloadProtect(() => doSlide);
      else doSlide();
    },
  });

  const addLabel = isInRecordSet
    ? formsText.addToRecordSet({
        recordSetTable: tables.RecordSet.label,
      })
    : commonText.add();
  const removeLabel = isInRecordSet
    ? formsText.removeFromRecordSet({
        recordSetTable: tables.RecordSet.label,
      })
    : commonText.delete();
  const isReadOnly = React.useContext(ReadOnlyContext);

  const hasAttachments = tablesWithAttachments().includes(table);

  const isNewRecordSet = isInRecordSet && title === undefined;

  return (
    <>
      <ResourceView
        dialog={dialog}
        headerButtons={(specifyNetworkBadge): JSX.Element => (
          <div className="flex flex-col items-center gap-2 md:contents md:flex-row md:gap-8">
            <div className="flex items-center gap-2 md:contents">
              {headerButtons}
              <DataEntry.Visit
                resource={
                  !isDependent && dialog !== false ? resource : undefined
                }
              />
              {hasTablePermission(
                table.name,
                isDependent ? 'create' : 'read'
              ) && typeof handleAdding === 'function' ? (
                <DataEntry.Add
                  aria-label={addLabel}
                  disabled={isReadOnly}
                  title={addLabel}
                  onClick={() => {
                    const resource = new table.Resource();
                    handleAdding([resource]);
                  }}
                />
              ) : undefined}
              {typeof handleRemove === 'function' && canRemove ? (
                <DataEntry.Remove
                  aria-label={removeLabel}
                  disabled={resource === undefined || isReadOnly}
                  title={removeLabel}
                  onClick={(): void => handleRemove('minusButton')}
                />
              ) : undefined}
              {typeof newResource === 'object' && handleAdd !== undefined ? (
                <p className="flex-1">{formsText.creatingNewRecord()}</p>
              ) : (
                <span
                  className={`flex-1 ${dialog === false ? '-ml-2' : '-ml-4'}`}
                />
              )}
              {hasAttachments &&
              !hasSeveralResourceType &&
              !resource?.isNew() ? (
                <RecordSetAttachments
                  records={records}
                  recordSetName={recordSetName}
                  onFetch={handleFetch}
                />
              ) : undefined}
              {table.view === 'GeologicTimePeriod' ? (
                <ChronoChart />
              ) : undefined}
              {specifyNetworkBadge}
            </div>
            {totalCount > 1 && <div>{slider}</div>}
          </div>
        )}
        isDependent={isDependent}
        isInRecordSet={!isNewRecordSet}
        isLoading={isLoading || isExternalLoading}
        isSubForm={false}
        resource={resource}
        title={title}
        viewName={viewName}
        onAdd={handleClone}
        onClose={handleClose}
        onDeleted={
          resource?.isNew() === true || hasTablePermission(table.name, 'delete')
            ? handleRemove?.bind(undefined, 'deleteButton')
            : undefined
        }
        onSaved={(): void => handleSaved(resource!)}
      />

      {dialogs}

      {typeof unloadProtect === 'function' && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Warning
                onClick={(): void => {
                  unsetUnloadProtect(setUnloadProtects, saveFormUnloadProtect);
                  setUnloadProtects([]);
                  unloadProtect();
                  setUnloadProtect(undefined);
                }}
              >
                {commonText.proceed()}
              </Button.Warning>
            </>
          }
          header={formsText.recordSelectorUnloadProtect()}
          onClose={(): void => setUnloadProtect(undefined)}
        >
          {formsText.recordSelectorUnloadProtectDescription()}
        </Dialog>
      )}
    </>
  );
}
