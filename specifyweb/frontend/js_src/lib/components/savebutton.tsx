import React from 'react';

import { Http } from '../ajax';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import * as navigation from '../navigation';
import { defined } from '../types';
import { camelToHuman } from '../wbplanviewhelper';
import { Button, className, Submit } from './basic';
import { useId } from './hooks';
import { Dialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';

function handleFocus(event: FocusEvent): void {
  const target = event.target as HTMLElement;
  /*
   * Don't display "This is a required field" error or pattern
   * mismatch message until input was interacted with
   */
  target.classList.remove('not-touched');
}

function SaveButton({
  model,
  canAddAnother = true,
  form,
  onSaving: handleSaving,
  onSaved: handleSaved,
}: {
  readonly model: SpecifyResource;
  readonly canAddAnother?: boolean;
  readonly form: HTMLFormElement;
  readonly onSaving?: () => void;
  readonly onSaved?: (payload: {
    readonly addAnother: boolean;
    readonly newResource: SpecifyResource | undefined;
    readonly wasNew: boolean;
  }) => void;
}): JSX.Element {
  const id = useId('save-button');
  const [saveRequired, setSaveRequired] = React.useState(model.isNew());
  React.useEffect(() => {
    if (!saveRequired)
      navigation.addUnloadProtect(
        id('unload-protect'),
        formsText('unsavedFormUnloadProtect')
      );
    return (): void => navigation.removeUnloadProtect(id('unload-protect'));
  }, [id, saveRequired]);

  const [saveBlocked, setSaveBlocked] = React.useState(false);
  React.useEffect(() => {
    model.on('saverequired changing', () => {
      setSaveRequired(true);
    });
    function handleChanged(): void {
      const onlyDeferredBlockers = Array.from(
        model.saveBlockers.blockingResources
      ).every((resource) => resource.saveBlockers.hasOnlyDeferredBlockers());
      setSaveBlocked(!onlyDeferredBlockers);
    }
    handleChanged();
    model.on('blockerschanged', handleChanged);
  }, [model]);

  const [isSaving, setIsSaving] = React.useState(false);
  const [showSaveBlockedDialog, setShowBlockedDialog] = React.useState(false);
  const [isSaveConflict, setIsSaveConflict] = React.useState(false);

  const [formId, setFormId] = React.useState(id('form'));
  React.useEffect(() => {
    if (form.id === '') form.id = id('form');
    setFormId(form.id);

    // TODO: remove this once everything is using controlled components
    Array.from(form.querySelectorAll('input, textarea, select'), (element) =>
      element.classList.add(className.notTouchedInput)
    );
    form.classList.add(className.notSubmittedForm);

    form.addEventListener('focusout', handleFocus);
    return (): void => form.removeEventListener('focusout', handleFocus);
  }, [form, id]);

  async function handleSubmit(
    event: SubmitEvent | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    addAnother: boolean = false
  ): Promise<void> {
    event.preventDefault();

    if (saveBlocked || (!saveRequired && !addAnother)) return;

    await model.businessRuleMgr.pending;

    const blockingResources = Array.from(model.saveBlockers.blockingResources);
    blockingResources.forEach((resource) =>
      resource.saveBlockers.fireDeferredBlockers()
    );
    if (blockingResources.length > 0) {
      setShowBlockedDialog(true);
      return;
    }
    setIsSaving(true);

    /*
     * This has to be done before saving so that the data we get back isn't copied.
     * Eg. autonumber fields, the id, etc.
     */
    const newResource = addAnother ? model.clone() : undefined;
    const wasNew = model.isNew();
    handleSaving?.();
    model
      .save()
      .then(() =>
        handleSaved?.({
          addAnother,
          newResource,
          wasNew,
        })
      )
      .then(
        () => setIsSaving(false),
        (jqXHR: { readonly status: number; errorHandled: boolean }) => {
          if (jqXHR.status !== Http.CONFLICT) return;
          jqXHR.errorHandled = true;
          setIsSaveConflict(true);
        }
      );
  }

  React.useEffect(() => {
    const callback = (event: SubmitEvent): void =>
      void handleSubmit(event).catch(console.error);
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
          onClick={(event): void => {
            handleSubmit(event, true).catch(console.error);
            /*
             * If tried to submit form, unhide field validation errors
             * (pattern mismatch and missing required value)
             *
             * Can't do this inside of onsubmit handler, because
             * onsubmit is only called on valid forms
             */
            form.classList.remove('not-submitted');
          }}
        >
          {saveRequired
            ? formsText('saveAndAddAnother')
            : formsText('addAnother')}
        </ButtonComponent>
      )}
      <SubmitComponent
        form={formId}
        className={saveBlocked ? 'cursor-not-allowed' : undefined}
        disabled={isSaving || (!saveRequired && !saveBlocked)}
        value={commonText('save')}
        onClick={(): void => form.classList.remove('not-submitted')}
      />
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
          <ul>
            {Array.from(model.saveBlockers.blockingResources, (resource) => (
              <li key={resource.cid}>
                <h3>{resource.specifyModel.getLocalizedName()}</h3>
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
                              ).getLocalizedName()
                            : camelToHuman(key)}
                        </dt>
                        <dd>{blocker.reason}</dd>
                      </React.Fragment>
                    )
                  )}
                </dl>
              </li>
            ))}
          </ul>
        </Dialog>
      ) : undefined}
    </>
  );
}

export default createBackboneView(SaveButton);
