import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useUnloadProtect } from '../../hooks/navigation';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { useIsModified } from '../../hooks/useIsModified';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { listen } from '../../utils/events';
import { replaceKey } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { BlockerWithResource } from '../DataModel/saveBlockers';
import {
  findUnclaimedBlocker,
  useAllSaveBlockers,
} from '../DataModel/saveBlockers';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { Tables } from '../DataModel/types';
import { error } from '../Errors/assert';
import { errorHandledBy } from '../Errors/FormatError';
import { Dialog } from '../Molecules/Dialog';
import { hasTablePermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { smoothScroll } from '../QueryBuilder/helpers';
import { generateMappingPathPreview } from '../WbPlanView/mappingPreview';
import { FormContext } from './BaseResourceView';
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
  readonly onAdd?: (newResource: SpecifyResource<SCHEMA>) => void;
  // Only display save blockers for a given field
  readonly filterBlockers?: LiteralField | Relationship;
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

  const { showClone, showCarry, showAdd } = useEnabledButtons(
    resource.specifyTable.name
  );

  const canCreate = hasTablePermission(resource.specifyTable.name, 'create');
  const canUpdate = hasTablePermission(resource.specifyTable.name, 'update');
  const canSave = resource.isNew() ? canCreate : canUpdate;

  const isSaveDisabled =
    disabled ||
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
      (resource.businessRuleManager?.pendingPromises ?? Promise.resolve()).then(
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

  const ButtonComponent = saveBlocked ? Button.Red : Button.Specify;
  const SubmitComponent = saveBlocked ? Submit.Red : Submit.Specify;
  // Don't allow cloning the resource if it changed
  const isChanged = saveRequired || externalSaveRequired;

  const copyButton = (
    label: LocalizedString,
    description: LocalizedString,
    handleClick: () => Promise<SpecifyResource<SCHEMA>>
  ): JSX.Element => (
    <ButtonComponent
      className={saveBlocked ? '!cursor-not-allowed' : undefined}
      disabled={resource.isNew() || isChanged || isSaving}
      title={description}
      onClick={(): void => {
        // Scroll to the top of the form on clone
        smoothScroll(form, 0);
        loading(handleClick().then(handleAdd));
      }}
    >
      {label}
    </ButtonComponent>
  );

  return (
    <>
      {typeof handleAdd === 'function' && canCreate ? (
        <>
          {showClone &&
            copyButton(
              formsText.clone(),
              formsText.cloneDescription(),
              async () => resource.clone(true)
            )}
          {showCarry &&
            copyButton(
              formsText.carryForward(),
              formsText.carryForwardDescription(),
              async () => resource.clone(false)
            )}
          {showAdd &&
            copyButton(
              commonText.add(),
              formsText.addButtonDescription(),
              async () => new resource.specifyTable.Resource()
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
            <Button.Red onClick={(): void => globalThis.location.reload()}>
              {commonText.close()}
            </Button.Red>
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
function useEnabledButtons(tableName: keyof Tables): {
  readonly showClone: boolean;
  readonly showCarry: boolean;
  readonly showAdd: boolean;
} {
  const [enableCarryForward] = userPreferences.use(
    'form',
    'preferences',
    'enableCarryForward'
  );
  const [disableClone] = userPreferences.use(
    'form',
    'preferences',
    'disableClone'
  );
  const [disableAdd] = userPreferences.use('form', 'preferences', 'disableAdd');
  const showCarry =
    enableCarryForward.includes(tableName) && !NO_CLONE.has(tableName);
  const showClone =
    !disableClone.includes(tableName) && !NO_CLONE.has(tableName);
  const showAdd =
    !disableAdd.includes(tableName) && !FORBID_ADDING.has(tableName);

  return { showClone, showCarry, showAdd };
}
