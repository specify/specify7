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
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { FormMode } from '../FormParse';
import { ResourceView } from '../Forms/ResourceView';
import { saveFormUnloadProtect } from '../Forms/Save';
import { Dialog } from '../Molecules/Dialog';
import { hasTablePermission } from '../Permissions/helpers';
import { SetUnloadProtectsContext } from '../Router/Router';
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
  model,
  viewName,
  title = model.label,
  headerButtons,
  dialog,
  isDependent,
  mode,
  canRemove = true,
  isLoading: isExternalLoading = false,
  isInRecordSet = false,
  onClose: handleClose,
  onSaved: handleSaved,
  onAdd: handleAdd,
  onClone: handleClone,
  onDelete: handleDelete,
  ...rest
}: Omit<RecordSelectorProps<SCHEMA>, 'index' | 'records'> & {
  /*
   * Undefined IDs are placeholders for items with unknown IDs (e.g in record
   * sets or query results with thousands of items)
   */
  readonly ids: RA<number | undefined>;
  readonly newResource: SpecifyResource<SCHEMA> | undefined;
  readonly defaultIndex?: number;
  readonly title: LocalizedString | undefined;
  readonly headerButtons?: JSX.Element;
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly isDependent: boolean;
  readonly mode: FormMode;
  readonly viewName?: string;
  readonly canRemove?: boolean;
  readonly isLoading?: boolean;
  // Record set ID, or false to not update the URL
  readonly isInRecordSet?: boolean;
  readonly onClose: () => void;
  readonly onSaved: (resource: SpecifyResource<SCHEMA>) => void;
  readonly onClone:
    | ((newResource: SpecifyResource<SCHEMA>) => void)
    | undefined;
}): JSX.Element | null {
  const [records, setRecords] = React.useState<
    RA<SpecifyResource<SCHEMA> | undefined>
  >(() =>
    ids.map((id) => (id === undefined ? undefined : new model.Resource({ id })))
  );

  const previousIds = React.useRef(ids);
  React.useEffect(() => {
    setRecords((records) =>
      ids.map((id, index) => {
        if (id === undefined) return undefined;
        else if (records[index]?.id === id) return records[index];
        else return new model.Resource({ id });
      })
    );

    return (): void => {
      previousIds.current = ids;
    };
  }, [ids, model]);

  const [index, setIndex] = useTriggerState(
    Math.max(0, defaultIndex ?? ids.length - 1)
  );
  React.useEffect(
    () =>
      setIndex((index) =>
        Math.max(
          0,
          typeof newResource === 'object'
            ? rest.totalCount
            : Math.min(index, rest.totalCount - 1)
        )
      ),
    [newResource, rest.totalCount]
  );

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
    model,
    records:
      typeof newResource === 'object' ? [...records, newResource] : records,
    totalCount: rest.totalCount + (typeof newResource === 'object' ? 1 : 0),
    onAdd:
      typeof handleAdd === 'function'
        ? (resources): void => {
            if (currentResource?.needsSaved === true)
              /*
               * Since React's setState has a special behavior when a function
               * argument is passed, need to wrap a function in a function
               */
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
    onSlide:
      typeof handleSlide === 'function'
        ? (index, replace, callback): void => {
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
          }
        : undefined,
  });

  const addLabel = isInRecordSet
    ? formsText.addToRecordSet({
        recordSetTable: schema.models.RecordSet.label,
      })
    : commonText.add();
  const removeLabel = isInRecordSet
    ? formsText.removeFromRecordSet({
        recordSetTable: schema.models.RecordSet.label,
      })
    : commonText.delete();
  return (
    <>
      <ResourceView
        dialog={dialog}
        headerButtons={(specifyNetworkBadge): JSX.Element => (
          <div className="flex flex-col items-center gap-2 md:flex-row md:gap-8">
            <div className="flex gap-2">
              {headerButtons}
              <DataEntry.Visit
                resource={
                  !isDependent && dialog !== false ? resource : undefined
                }
              />
              {hasTablePermission(
                model.name,
                isDependent ? 'create' : 'read'
              ) && typeof handleAdding === 'function' ? (
                <DataEntry.Add
                  aria-label={addLabel}
                  disabled={mode === 'view'}
                  title={addLabel}
                  onClick={handleAdding}
                />
              ) : undefined}
              {typeof handleRemove === 'function' && canRemove ? (
                <DataEntry.Remove
                  aria-label={removeLabel}
                  disabled={resource === undefined || mode === 'view'}
                  title={removeLabel}
                  onClick={(): void => handleRemove('minusButton')}
                />
              ) : undefined}
              {typeof newResource === 'object' ? (
                <p className="flex-1">{formsText.creatingNewRecord()}</p>
              ) : (
                <span
                  className={`flex-1 ${dialog === false ? '-ml-2' : '-ml-4'}`}
                />
              )}
              {specifyNetworkBadge}
            </div>
            <div>{slider}</div>
          </div>
        )}
        isDependent={isDependent}
        isLoading={isLoading || isExternalLoading}
        isSubForm={false}
        mode={mode}
        resource={resource}
        title={title}
        viewName={viewName}
        onAdd={handleClone}
        onClose={handleClose}
        onDeleted={
          resource?.isNew() === true || hasTablePermission(model.name, 'delete')
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
              <Button.Orange
                onClick={(): void => {
                  unsetUnloadProtect(setUnloadProtects, saveFormUnloadProtect);
                  setUnloadProtects([]);
                  unloadProtect();
                  setUnloadProtect(undefined);
                }}
              >
                {commonText.proceed()}
              </Button.Orange>
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
