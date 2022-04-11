import React from 'react';

import { error } from '../assert';
import type { AnySchema } from '../datamodelutils';
import { camelToHuman, replaceKey } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { defined } from '../types';
import { Button, className, H3, Submit, Ul } from './basic';
import { LoadingContext } from './contexts';
import { crash } from './errorboundary';
import {
  useBooleanState,
  useId,
  useIsModified,
  useUnloadProtect,
} from './hooks';
import { Dialog } from './modaldialog';
import { FormContext } from './resourceview';

/*
 * TODO: handle case when there are save blockers for field that is not
 *   rendered on the form
 * TODO: move this logic into ResourceView, so that <form> and button is
 *   defined in the same place
 */
export function SaveButton<SCHEMA extends AnySchema = AnySchema>({
  resource,
  canAddAnother,
  form,
  onSaving: handleSaving,
  onSaved: handleSaved,
  disabled,
  saveRequired: externalSaveRequired,
}: {
  readonly resource: SpecifyResource<SCHEMA>;
  readonly canAddAnother: boolean;
  readonly form: HTMLFormElement;
  // Returning false would cancel the save proces (allowing to trigger custom behaviour)
  readonly onSaving?: () => void | undefined | boolean;
  readonly onSaved?: (payload: {
    readonly newResource: SpecifyResource<SCHEMA> | undefined;
    readonly wasNew: boolean;
  }) => void;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  /*
   * Can enable Save button even if no save is required (i.e., when there were
   * changes to fields that are not stored with the resource
   */
  readonly saveRequired?: boolean;
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

    function handleChanged(): void {
      const onlyDeferredBlockers = Array.from(
        resource.saveBlockers.blockingResources
      ).every((resource) => resource.saveBlockers.hasOnlyDeferredBlockers());
      setSaveBlocked(!onlyDeferredBlockers);
    }

    handleChanged();
    resource.on('blockerschanged', handleChanged);
    return (): void => resource.off('blockerschanged', handleChanged);
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
    addAnother = false
  ): Promise<void> {
    setFormContext?.(replaceKey(formContext, 'triedToSubmit', true));
    event.preventDefault();
    event.stopPropagation();

    if (saveBlocked || (!saveRequired && !externalSaveRequired && !addAnother))
      return;

    await resource.businessRuleMgr.pending;

    const blockingResources = Array.from(
      resource.saveBlockers.blockingResources
    );
    blockingResources.forEach((resource) =>
      resource.saveBlockers.fireDeferredBlockers()
    );
    if (blockingResources.length > 0) {
      setShowBlockedDialog(true);
      return;
    }

    /*
     * This has to be done before saving so that the data we get back isn't copied.
     * Eg. autonumber fields, the id, etc.
     */
    const newResource = addAnother ? resource.clone() : undefined;
    const wasNew = resource.isNew();

    // Save process is canceled if false was returned
    if (handleSaving?.() === false) return;

    setIsSaving(true);
    loading(
      (resource.needsSaved ? resource.save(hasSaveConflict) : Promise.resolve())
        .then(() => {
          unsetUnloadProtect();
          handleSaved?.({
            newResource,
            wasNew,
          });
        })
        .then(() => resource.trigger('saved'))
        .then(() => setIsSaving(false))
        .catch((error_) =>
          Object.getOwnPropertyDescriptor(error_ ?? {}, 'handledBy')?.value ===
          hasSaveConflict
            ? undefined
            : error(error_)
        )
    );
  }

  React.useEffect(() => {
    const callback = (event: SubmitEvent): void => loading(handleSubmit(event));
    form.addEventListener('submit', callback);
    return (): void => form.removeEventListener('submit', callback);
  }, [form, handleSubmit]);

  const ButtonComponent = saveBlocked ? Button.Red : Button.Orange;
  const SubmitComponent = saveBlocked ? Submit.Red : Submit.Orange;
  return (
    <>
      {canAddAnother && (
        <ButtonComponent
          className={saveBlocked ? 'cursor-not-allowed' : undefined}
          disabled={isSaving}
          onClick={(event): void => void handleSubmit(event, true).catch(crash)}
        >
          {saveRequired || externalSaveRequired || resource.isNew()
            ? formsText('saveAndAddAnother')
            : formsText('addAnother')}
        </ButtonComponent>
      )}
      <SubmitComponent
        form={formId}
        className={saveBlocked ? 'cursor-not-allowed' : undefined}
        /*
         * Don't disable the button if saveBlocked, so that clicking the button
         * would make browser focus the invalid field
         */
        disabled={
          disabled ||
          isSaving ||
          (!saveRequired && !externalSaveRequired && !saveBlocked)
        }
        onClick={(): void => form.classList.remove(className.notSubmittedForm)}
      >
        {commonText('save')}
      </SubmitComponent>
      {isSaveConflict ? (
        <Dialog
          title={formsText('saveConflictDialogTitle')}
          header={formsText('saveConflictDialogHeader')}
          buttons={
            <Button.Red onClick={(): void => window.location.reload()}>
              {commonText('close')}
            </Button.Red>
          }
          onClose={undefined}
        >
          {formsText('saveConflictDialogMessage')}
        </Dialog>
      ) : showSaveBlockedDialog ? (
        <Dialog
          title={formsText('saveBlockedDialogTitle')}
          header={formsText('saveBlockedDialogHeader')}
          buttons={commonText('close')}
          onClose={(): void => setShowBlockedDialog(false)}
        >
          <p>{formsText('saveBlockedDialogMessage')}</p>
          <Ul>
            {Array.from(resource.saveBlockers.blockingResources, (resource) => (
              <li key={resource.cid}>
                <H3>{resource.specifyModel.label}</H3>
                <dl>
                  {Object.entries(resource.saveBlockers.blockers).map(
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
            ))}
          </Ul>
        </Dialog>
      ) : undefined}
    </>
  );
}
