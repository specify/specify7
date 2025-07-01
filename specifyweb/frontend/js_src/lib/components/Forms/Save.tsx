import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useUnloadProtect } from '../../hooks/navigation';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { useIsModified } from '../../hooks/useIsModified';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { ajax } from '../../utils/ajax';
import { smoothScroll } from '../../utils/dom';
import { listen } from '../../utils/events';
import {
  formatterToParser,
  getValidationAttributes,
} from '../../utils/parser/definitions';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { keysToLowerCase, replaceKey } from '../../utils/utils';
import { appResourceSubTypes } from '../AppResources/types';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import type { AnySchema, SerializedRecord } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { BlockerWithResource } from '../DataModel/saveBlockers';
import {
  findUnclaimedBlocker,
  useAllSaveBlockers,
} from '../DataModel/saveBlockers';
import {
  deserializeResource,
  serializeResource,
} from '../DataModel/serializers';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import { tables } from '../DataModel/tables';
import { error } from '../Errors/assert';
import { errorHandledBy } from '../Errors/FormatError';
import { InFormEditorContext } from '../FormEditor/Context';
import { tableValidForBulkClone } from '../FormMeta/CarryForward';
import { Dialog } from '../Molecules/Dialog';
import { hasTablePermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { generateMappingPathPreview } from '../WbPlanView/mappingPreview';
import { FormContext } from './BaseResourceView';
import { BulkCarryRangeBlockedDialog } from './BulkCarryForward';
import { FORBID_ADDING, NO_CLONE } from './ResourceView';
export const saveFormUnloadProtect = formsText.unsavedFormUnloadProtect();

/*
 * REFACTOR: move this logic into ResourceView, so that <form> and button is
 *   defined in the same place
 * BUG: if required field is set as readonly in the form, it will prevent
 *   saving, but validation error won't be shown
 */
/**
 * A button to save a resource
 * Checks for save blockers and validation errors
 * Handles save conflicts
 */
export function SaveButton<SCHEMA extends AnySchema = AnySchema>({
  resource,
  form,
  label: saveLabel = commonText.save(),
  disabled = false,
  saveRequired: externalSaveRequired = false,
  filterBlockers,
  onSaving: handleSaving,
  onSaved: handleSaved,
  onAdd: handleAdd,
  isInRecordSet,
}: {
  readonly resource: SpecifyResource<SCHEMA>;
  readonly form: HTMLFormElement;
  readonly label?: LocalizedString;
  readonly disabled?: boolean;
  /*
   * Can enable Save button even if no save is required (i.e., when there were
   * changes to fields that are not stored with the resource
   */
  readonly saveRequired?: boolean;
  // Returning false would cancel the save proces (allowing to trigger custom behaviour)
  readonly onSaving?: (
    unsetUnloadProtect: () => void
  ) => false | undefined | void;
  readonly onSaved?: () => void;
  readonly onAdd?: (resources: RA<SpecifyResource<SCHEMA>>) => void;
  // Only display save blockers for a given field
  readonly filterBlockers?: LiteralField | Relationship;
  readonly isInRecordSet?: boolean;
}): JSX.Element {
  const id = useId('save-button');
  const saveRequired = useIsModified(resource);
  const unsetUnloadProtect = useUnloadProtect(
    saveRequired || externalSaveRequired,
    saveFormUnloadProtect
  );

  const blockers = useAllSaveBlockers(resource, filterBlockers);
  const saveBlocked = blockers.length > 0;

  const [isSaving, setIsSaving] = React.useState(false);
  const [shownBlocker, setShownBlocker] = React.useState<
    BlockerWithResource | undefined
  >(undefined);
  const [isSaveConflict, hasSaveConflict] = useBooleanState();

  const [formId, setFormId] = React.useState(id('form'));
  React.useEffect(() => {
    if (form.id === '') form.id = id('form');
    setFormId(form.id);
  }, [form, id]);

  const loading = React.useContext(LoadingContext);
  const [_, setFormContext] = React.useContext(FormContext);

  const {
    showClone,
    showCarry,
    showBulkCarryCount,
    showBulkCarryRange,
    showAdd,
  } = useEnabledButtons(resource);

  const canCreate = hasTablePermission(resource.specifyTable.name, 'create');
  const canUpdate = hasTablePermission(resource.specifyTable.name, 'update');
  const canSave = resource.isNew() ? canCreate : canUpdate;

  const isInFormEditor = React.useContext(InFormEditorContext);

  const isSaveDisabled =
    disabled ||
    isInFormEditor ||
    isSaving ||
    !canSave ||
    (!saveRequired &&
      !externalSaveRequired &&
      /*
       * Don't disable the button if saveBlocked, so that clicking the
       * button would make browser focus the invalid field
       */
      !saveBlocked &&
      /*
       * Enable the button for new resources, even if there are no
       * unsaved changes so that empty resources can be saved. If that
       * is not desirable, remove the following line
       */
      !resource.isNew());

  function handleSubmit(): void {
    if (typeof setFormContext === 'function')
      setFormContext((formContext) =>
        replaceKey(formContext, 'triedToSubmit', true)
      );

    loading(
      (resource.businessRuleManager?.pendingPromise ?? Promise.resolve()).then(
        async () => {
          if (blockers.length > 0) {
            const blocker = findUnclaimedBlocker(blockers);
            if (blocker === undefined) return undefined;
            console.error(
              'Unclaimed blocker discovered (is not handled by any react component)',
              {
                blocker,
                resource,
              }
            );
            setShownBlocker(blocker);
            return undefined;
          }

          /*
           * Save process is canceled if false was returned. This also allows to
           * implement custom save behavior
           */
          if (handleSaving?.(unsetUnloadProtect) === false) return undefined;

          setIsSaving(true);
          return resource
            .save({ onSaveConflict: hasSaveConflict })
            .catch((error_) =>
              // FEATURE: if form save fails, should make the error message dismissible (if safe)
              Object.getOwnPropertyDescriptor(error_ ?? {}, errorHandledBy)
                ?.value === hasSaveConflict
                ? undefined
                : error(error_)
            )
            .finally(() => {
              unsetUnloadProtect();
              handleSaved?.();
              setIsSaving(false);
            });
        }
      )
    );
  }

  const handleSubmitRef = React.useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  React.useEffect(
    () =>
      listen(form, 'submit', (event) => {
        event.preventDefault();
        event.stopPropagation();
        handleSubmitRef.current();
      }),
    [loading, form]
  );

  const ButtonComponent = saveBlocked ? Button.Danger : Button.Save;
  const SubmitComponent = saveBlocked ? Submit.Danger : Submit.Save;

  // Don't allow cloning the resource if it changed
  const isChanged = saveRequired || externalSaveRequired;

  const copyButton = (
    label: LocalizedString,
    description: LocalizedString,
    disabled: boolean,
    handleClick: () =>
      | Promise<RA<SpecifyResource<SCHEMA>> | undefined>
      | Promise<RA<SpecifyResource<SCHEMA>>>
  ): JSX.Element => (
    <ButtonComponent
      className={saveBlocked ? '!cursor-not-allowed' : undefined}
      disabled={disabled || resource.isNew() || isChanged || isSaving}
      title={description}
      onClick={(): void => {
        // Scroll to the top of the form on clone
        smoothScroll(form, 0);
        loading(
          handleClick().then((resources) =>
            resources && handleAdd ? handleAdd(resources) : undefined
          )
        );
      }}
    >
      {label}
    </ButtonComponent>
  );

  const [carryForwardAmount, setCarryForwardAmount] = React.useState<number>(1);
  const [carryForwardRangeEnd, setCarryForwardRangeEnd] =
    React.useState<string>('');

  const isCOGorCOJO =
    resource.specifyTable.name === 'CollectionObjectGroup' ||
    resource.specifyTable.name === 'CollectionObjectGroupJoin';

  // Disable bulk carry forward for COType cat num format that are undefined or one of types listed in tableValidForBulkClone()
  const numberField =
    tables.CollectionObject.strictGetLiteralField('catalogNumber');
  const formatter = numberField.getUiFormatter(resource)!;
  const disableBulk =
    !tableValidForBulkClone(resource.specifyTable, resource) ||
    formatter === undefined;
  const canAutoNumberFormatter = formatter.canAutoIncrement();
  const parser = formatterToParser(numberField, formatter);

  const [bulkCarryRangeBlocked, setBulkCarryRangeBlocked] =
    React.useState(false);
  const [bulkCarryRangeInvalidNumbers, setBulkCarryRangeInvalidNumbers] =
    React.useState<RA<string> | undefined>(undefined);

  const handleBulkCarryForward = async (): Promise<
    RA<SpecifyResource<SCHEMA>> | undefined
  > => {
    const numberFieldName = 'catalogNumber';
    const wildCard = formatter.valueOrWild();
    let numbers: RA<number> | undefined;

    if (showBulkCarryRange) {
      const carryForwardRangeStart = resource.get(numberFieldName);
      if (
        carryForwardRangeStart === null ||
        !formatter.format(carryForwardRangeStart) ||
        !formatter.format(carryForwardRangeEnd) ||
        (formatter.format(carryForwardRangeStart) ?? '') >=
          (formatter.format(carryForwardRangeEnd) ?? '')
      ) {
        setBulkCarryRangeBlocked(true);
        return undefined;
      }

      const response = await ajax<{
        readonly values: RA<number>;
        readonly existing: RA<string>;
      }>(`/api/specify/series_autonumber_range/`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: keysToLowerCase({
          rangeStart: carryForwardRangeStart,
          rangeEnd: carryForwardRangeEnd,
          tableName: resource.specifyTable.name.toLowerCase(),
          fieldName: numberFieldName.toLowerCase(),
          formatterName: formatter.title,
          skipStartNumber: true,
        }),
      })
        .then(({ data }) => data)
        .catch((error) => {
          console.error(error);
          return undefined;
        });
      if (response === undefined) {
        setBulkCarryRangeBlocked(true);
        return undefined;
      }
      numbers = response.values;
      if (response.existing.length > 0) {
        setBulkCarryRangeInvalidNumbers(response.existing);
        setBulkCarryRangeBlocked(true);
        return undefined;
      }
    }

    const clonePromises = Array.from(
      { length: numbers ? numbers.length : carryForwardAmount },
      async (_, index) => {
        const clonedResource = await resource.clone(false, true);
        clonedResource.set(
          numberFieldName,
          numbers ? (numbers[index] as never) : (wildCard as never)
        );
        return clonedResource;
      }
    );

    const clones = await Promise.all(clonePromises);

    const backendClones = await ajax<RA<SerializedRecord<SCHEMA>>>(
      `/api/specify/bulk/${resource.specifyTable.name.toLowerCase()}/`,
      {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: clones,
      }
    ).then(({ data }) =>
      data.map((resource) => deserializeResource(serializeResource(resource)))
    );

    return Promise.all([resource, ...backendClones]);
  };

  return (
    <>
      {typeof handleAdd === 'function' && canCreate ? (
        <>
          {resource.specifyTable.name === 'CollectionObject' &&
          (isInRecordSet === false || isInRecordSet === undefined) &&
          isSaveDisabled &&
          showCarry &&
          (showBulkCarryCount || showBulkCarryRange) &&
          !isCOGorCOJO &&
          !disableBulk ? (
            showBulkCarryRange ? (
              canAutoNumberFormatter ? (
                <Label.Inline>
                  <Input.Text
                    aria-label={formsText.bulkCarryForwardRangeStart()}
                    className="!w-fit"
                    isReadOnly
                    placeholder={formatter.valueOrWild()}
                    value={resource.get('catalogNumber') ?? ''}
                    width={numberField.datamodelDefinition.length}
                  />
                  <Input.Text
                    aria-label={formsText.bulkCarryForwardRangeEnd()}
                    className="!w-fit"
                    {...getValidationAttributes(parser)}
                    placeholder={formatter.valueOrWild()}
                    value={carryForwardRangeEnd}
                    width={numberField.datamodelDefinition.length}
                    onValueChange={(value): void =>
                      setCarryForwardRangeEnd(value)
                    }
                  />
                </Label.Inline>
              ) : undefined
            ) : (
              <Input.Integer
                aria-label={formsText.bulkCarryForwardCount()}
                className="!w-fit"
                max={5000}
                min={1}
                placeholder="1"
                value={carryForwardAmount}
                onValueChange={(value): void =>
                  setCarryForwardAmount(Number(value))
                }
              />
            )
          ) : null}
          {showCarry && !isCOGorCOJO
            ? copyButton(
                formsText.carryForward(),
                formsText.carryForwardDescription(),
                /**
                 * FEATURE: Extend this functionality to all tables
                 * See https://github.com/specify/specify7/pull/4804
                 *
                 */
                !(
                  !showBulkCarryRange ||
                  (showBulkCarryRange && canAutoNumberFormatter)
                ),
                resource.specifyTable.name === 'CollectionObject' &&
                  (showBulkCarryRange || carryForwardAmount > 1)
                  ? handleBulkCarryForward
                  : async (): Promise<RA<SpecifyResource<SCHEMA>>> => [
                      await resource.clone(false),
                    ]
              )
            : undefined}
          {showClone && !isCOGorCOJO
            ? copyButton(
                formsText.clone(),
                formsText.cloneDescription(),
                false,
                async () => [await resource.clone(true)]
              )
            : undefined}
          {showAdd &&
            copyButton(
              commonText.add(),
              formsText.addButtonDescription(),
              false,
              async () => [new resource.specifyTable.Resource()]
            )}
        </>
      ) : undefined}
      {canSave && (
        <SubmitComponent
          className={saveBlocked ? '!cursor-not-allowed' : undefined}
          disabled={isSaveDisabled}
          form={formId}
          onClick={(): void =>
            form.classList.remove(className.notSubmittedForm)
          }
        >
          {saveLabel}
        </SubmitComponent>
      )}
      {isSaveConflict ? (
        <Dialog
          buttons={
            <Button.Danger onClick={(): void => globalThis.location.reload()}>
              {commonText.close()}
            </Button.Danger>
          }
          header={formsText.saveConflict()}
          onClose={undefined}
        >
          {formsText.saveConflictDescription()}
        </Dialog>
      ) : typeof shownBlocker === 'object' ? (
        <SaveBlockedDialog
          blocker={shownBlocker}
          onClose={(): void => setShownBlocker(undefined)}
        />
      ) : undefined}
      {bulkCarryRangeBlocked ? (
        <BulkCarryRangeBlockedDialog
          invalidNumbers={bulkCarryRangeInvalidNumbers}
          numberField={numberField}
          onClose={(): void => {
            setBulkCarryRangeBlocked(false);
            setBulkCarryRangeInvalidNumbers(undefined);
          }}
        />
      ) : undefined}
    </>
  );
}

function SaveBlockedDialog({
  blocker: { field, message },
  onClose: handleClose,
}: {
  readonly blocker: BlockerWithResource;
  readonly onClose: () => void;
}): JSX.Element {
  const pathPreview = React.useMemo(
    () =>
      generateMappingPathPreview(
        field[0].table.name,
        field.map(({ name }) => name)
      ),
    [field]
  );
  return (
    <Dialog
      buttons={commonText.close()}
      header={formsText.saveBlocked()}
      onClose={handleClose}
    >
      <p>{formsText.saveBlockedDescription()}</p>
      <p>
        {commonText.colonLine({
          label: pathPreview,
          value: message,
        })}
      </p>
    </Dialog>
  );
}

/**
 * Decide which of the "new resource" buttons to show
 */
function useEnabledButtons<SCHEMA extends AnySchema = AnySchema>(
  resource: SpecifyResource<SCHEMA>
): {
  readonly showClone: boolean;
  readonly showCarry: boolean;
  readonly showBulkCarryCount: boolean;
  readonly showBulkCarryRange: boolean;
  readonly showAdd: boolean;
} {
  const [enableCarryForward] = userPreferences.use(
    'form',
    'preferences',
    'enableCarryForward'
  );
  const [enableBulkCarryForward] = userPreferences.use(
    'form',
    'preferences',
    'enableBukCarryForward'
  );
  const [enableBulkCarryForwardRange] = userPreferences.use(
    'form',
    'preferences',
    'enableBulkCarryForwardRange'
  );
  const [disableClone] = userPreferences.use(
    'form',
    'preferences',
    'disableClone'
  );
  const [disableAdd] = userPreferences.use('form', 'preferences', 'disableAdd');

  const tableName = resource.specifyTable.name;
  const appResourceName =
    resource.specifyTable.name === 'SpAppResource'
      ? resource.get('name')
      : undefined;

  const isDisabledCloneAppResource = appResourcesToNotClone.includes(
    (appResourceName ?? '').toLowerCase()
  );

  const showCarry =
    enableCarryForward.includes(tableName) && !NO_CLONE.has(tableName);
  const showBulkCarry =
    !NO_CLONE.has(tableName) && tableValidForBulkClone(resource.specifyTable);
  const showBulkCarryCount =
    showBulkCarry && enableBulkCarryForward.includes(tableName);
  const showBulkCarryRange =
    showBulkCarry && enableBulkCarryForwardRange.includes(tableName);
  const showClone =
    !disableClone.includes(tableName) &&
    !NO_CLONE.has(tableName) &&
    !isDisabledCloneAppResource;
  const showAdd =
    !disableAdd.includes(tableName) && !FORBID_ADDING.has(tableName);

  return {
    showClone,
    showCarry,
    showBulkCarryCount,
    showBulkCarryRange,
    showAdd,
  };
}

const appResourcesToNotClone = filterArray(
  Object.keys(appResourceSubTypes).map((key) =>
    appResourceSubTypes[key]?.name?.toLowerCase()
  )
);
