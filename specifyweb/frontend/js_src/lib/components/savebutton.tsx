import React from 'react';

import { error } from '../assert';
import type { AnySchema } from '../datamodelutils';
import { listen } from '../events';
import { camelToHuman, replaceKey } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { hasTablePermission } from '../permissions';
import { resourceOn } from '../resource';
import { defined } from '../types';
import { Button, className, H3, Submit, Ul } from './basic';
import { FormContext, LoadingContext } from './contexts';
import { fail } from './errorboundary';
import { useBooleanState, useId, useIsModified } from './hooks';
import { Dialog } from './modaldialog';
import { useUnloadProtect } from './navigation';
import { NO_CLONE } from './resourceview';

/*
 * REFACTOR: move this logic into ResourceView, so that <form> and button is
 *   defined in the same place
 */
/**
 * A button to save a resource
 * Checks for save blockers and validation errors
 * Handles save conflicts
 */
export function SaveButton<SCHEMA extends AnySchema = AnySchema>({
  resource,
  canAddAnother,
  form,
  disabled = false,
  saveRequired: externalSaveRequired = false,
  onSaving: handleSaving,
  onSaved: handleSaved,
  onIgnored: handleIgnored,
}: {
  readonly resource: SpecifyResource<SCHEMA>;
  readonly canAddAnother: boolean;
  readonly form: HTMLFormElement;
  readonly disabled?: boolean;
  /*
   * Can enable Save button even if no save is required (i.e., when there were
   * changes to fields that are not stored with the resource
   */
  readonly saveRequired?: boolean;
  // Returning false would cancel the save proces (allowing to trigger custom behaviour)
  readonly onSaving?: () => void | undefined | boolean;
  readonly onSaved?: (payload: {
    readonly newResource: SpecifyResource<SCHEMA> | undefined;
    readonly wasNew: boolean;
    readonly wasChanged: boolean;
  }) => void;
  /**
   * Sometimes a save button click is ignored (mostly because of a validation
   * error). By default, this would focus the first erroring field on the form.
   * However, if the save blocker is not caused by some field on the form,
   * need to handle the ignored click manually.
   */
  readonly onIgnored?: () => void;
}): JSX.Element {
  const id = useId('save-button');
  const saveRequired = useIsModified(resource);
  const unsetUnloadProtect = useUnloadProtect(
    saveRequired,
    formsText('unsavedFormUnloadProtect')
  );

  const [saveBlocked, setSaveBlocked] = React.useState(false);
  React.useEffect(() => {
    setSaveBlocked(false);
    return resourceOn(
      resource,
      'blockersChanged',
      (): void => {
        const onlyDeferredBlockers = Array.from(
          resource.saveBlockers?.blockingResources ?? []
        ).every((resource) => resource.saveBlockers?.hasOnlyDeferredBlockers());
        setSaveBlocked(!onlyDeferredBlockers);
      },
      true
    );
  }, [resource]);

  const [isSaving, setIsSaving] = React.useState(false);
  const [showSaveBlockedDialog, setShowBlockedDialog] = React.useState(false);
  const [isSaveConflict, hasSaveConflict] = useBooleanState();

  const [formId, setFormId] = React.useState(id('form'));
  React.useEffect(() => {
    if (form.id === '') form.id = id('form');
    setFormId(form.id);
  }, [form, id]);

  const loading = React.useContext(LoadingContext);
  const [formContext, setFormContext] = React.useContext(FormContext);

  async function handleSubmit(
    event: SubmitEvent | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    mode: 'addAnother' | 'clone' | 'save' = 'save'
  ): Promise<void> {
    if (!form.reportValidity()) return;

    setFormContext?.(replaceKey(formContext, 'triedToSubmit', true));
    event.preventDefault();
    event.stopPropagation();

    if (
      // Cancel if don't have permission for this action
      (mode === 'save' ? !canSave : !canCreate) ||
      // Or save is blocked
      saveBlocked ||
      // Or trying to save a resources that doesn't need saving
      (!saveRequired &&
        !externalSaveRequired &&
        mode === 'save' &&
        !resource.isNew())
    ) {
      handleIgnored?.();
      return;
    }

    await resource.businessRuleMgr?.pending;

    const blockingResources = Array.from(
      resource.saveBlockers?.blockingResources ?? []
    );
    blockingResources.forEach((resource) =>
      resource.saveBlockers?.fireDeferredBlockers()
    );
    if (blockingResources.length > 0) {
      setShowBlockedDialog(true);
      return;
    }

    /*
     * This has to be done before saving so that the data we get back isn't copied.
     * Eg. autonumber fields, the id, etc.
     */
    const newResource =
      mode === 'clone'
        ? await resource.clone()
        : mode === 'addAnother'
        ? new resource.specifyModel.Resource()
        : undefined;
    const wasNew = resource.isNew();
    const wasChanged = resource.needsSaved;

    /*
     * Save process is canceled if false was returned. This also allows to
     * implement custom save behavior
     */
    if (handleSaving?.() === false) return;

    setIsSaving(true);
    loading(
      (resource.needsSaved || resource.isNew()
        ? resource.save(hasSaveConflict)
        : Promise.resolve()
      )
        .then(() => {
          unsetUnloadProtect();
          handleSaved?.({
            newResource,
            wasNew,
            wasChanged,
          });
        })
        .then(() => setIsSaving(false))
        .catch((error_) =>
          Object.getOwnPropertyDescriptor(error_ ?? {}, 'handledBy')?.value ===
          hasSaveConflict
            ? undefined
            : error(error_)
        )
    );
  }

  const canCreate = hasTablePermission(resource.specifyModel.name, 'create');
  const canUpdate = hasTablePermission(resource.specifyModel.name, 'update');
  const canSave = resource.isNew() ? canCreate : canUpdate;

  React.useEffect(
    // FEATURE: if form save fails, should make the error message dismissable (if safe)
    () => listen(form, 'submit', (event) => loading(handleSubmit(event))),
    [loading, form, handleSubmit]
  );

  // FEATURE: these buttons should use var(--brand-color), rather than orange
  const ButtonComponent = saveBlocked ? Button.Red : Button.Orange;
  const SubmitComponent = saveBlocked ? Submit.Red : Submit.Orange;
  // Don't allow cloning the resource if it changed
  const isChanged = saveRequired || externalSaveRequired || resource.isNew();
  return (
    <>
      {canAddAnother && canCreate ? (
        <>
          {!NO_CLONE.has(resource.specifyModel.name) && (
            <ButtonComponent
              className={saveBlocked ? '!cursor-not-allowed' : undefined}
              disabled={isSaving || isChanged}
              onClick={(event): void =>
                void handleSubmit(event, 'clone').catch(fail)
              }
            >
              {formsText('clone')}
            </ButtonComponent>
          )}
          <ButtonComponent
            className={saveBlocked ? '!cursor-not-allowed' : undefined}
            disabled={isSaving || isChanged}
            onClick={(event): void =>
              void handleSubmit(event, 'addAnother').catch(fail)
            }
          >
            {formsText('addAnother')}
          </ButtonComponent>
        </>
      ) : undefined}
      {canSave && (
        <SubmitComponent
          form={formId}
          className={saveBlocked ? '!cursor-not-allowed' : undefined}
          disabled={
            disabled ||
            isSaving ||
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
              !resource.isNew())
          }
          onClick={(): void =>
            form.classList.remove(className.notSubmittedForm)
          }
        >
          {commonText('save')}
        </SubmitComponent>
      )}
      {isSaveConflict ? (
        <Dialog
          header={formsText('saveConflictDialogHeader')}
          buttons={
            <Button.Red onClick={(): void => globalThis.location.reload()}>
              {commonText('close')}
            </Button.Red>
          }
          onClose={undefined}
        >
          {formsText('saveConflictDialogText')}
        </Dialog>
      ) : showSaveBlockedDialog ? (
        <Dialog
          header={formsText('saveBlockedDialogHeader')}
          buttons={commonText('close')}
          onClose={(): void => setShowBlockedDialog(false)}
        >
          <p>{formsText('saveBlockedDialogText')}</p>
          <Ul>
            {Array.from(
              resource.saveBlockers?.blockingResources ?? [],
              (resource) => (
                <li key={resource.cid}>
                  <H3>{resource.specifyModel.label}</H3>
                  <dl>
                    {Object.entries(resource.saveBlockers?.blockers ?? []).map(
                      ([key, blocker]) => (
                        <React.Fragment key={key}>
                          <dt>
                            {typeof blocker.fieldName === 'string'
                              ? defined(
                                  resource.specifyModel.getField(
                                    blocker.fieldName
                                  )
                                ).label
                              : camelToHuman(key)}
                          </dt>
                          <dd>{blocker.reason}</dd>
                        </React.Fragment>
                      )
                    )}
                  </dl>
                </li>
              )
            )}
          </Ul>
        </Dialog>
      ) : undefined}
    </>
  );
}
