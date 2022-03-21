import React from 'react';

import { Http } from '../ajax';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { defined } from '../types';
import { camelToHuman } from '../wbplanviewhelper';
import { Button, className, H3, Submit, Ul } from './basic';
import { crash } from './errorboundary';
import { useBooleanState, useId, useUnloadProtect } from './hooks';
import { Dialog, LoadingScreen } from './modaldialog';

function handleFocus(event: FocusEvent): void {
  const target = event.target as HTMLElement;
  /*
   * Don't display "This is a required field" error or pattern
   * mismatch message until input was interacted with
   */
  target.classList.remove('not-touched');
}

export function SaveButton<SCHEMA extends AnySchema = AnySchema>({
  model,
  canAddAnother,
  form,
  onSaving: handleSaving,
  onSaved: handleSaved,
}: {
  readonly model: SpecifyResource<SCHEMA>;
  readonly canAddAnother: boolean;
  readonly form: HTMLFormElement;
  readonly onSaving?: () => void;
  readonly onSaved?: (payload: {
    readonly addAnother: boolean;
    readonly newResource: SpecifyResource<SCHEMA> | undefined;
    readonly wasNew: boolean;
  }) => void;
}): JSX.Element {
  const id = useId('save-button');
  const [saveRequired, setSaveRequired] = React.useState(model.isNew());
  useUnloadProtect(saveRequired, formsText('unsavedFormUnloadProtect'));

  const [saveBlocked, setSaveBlocked] = React.useState(false);
  React.useEffect(() => {
    const handleSaveRequired = (): void => setSaveRequired(true);
    model.on('saverequired', handleSaveRequired);

    function handleChanged(): void {
      const onlyDeferredBlockers = Array.from(
        model.saveBlockers.blockingResources
      ).every((resource) => resource.saveBlockers.hasOnlyDeferredBlockers());
      setSaveBlocked(!onlyDeferredBlockers);
    }

    handleChanged();
    model.on('blockerschanged', handleChanged);
    return (): void => {
      model.off('saverequired', handleSaveRequired);
      model.off('blockerschanged', handleChanged);
    };
  }, [model]);

  const [isSaving, setIsSaving] = React.useState(false);
  const [showSaveBlockedDialog, setShowBlockedDialog] = React.useState(false);
  const [isSaveConflict, hasSaveConflict] = useBooleanState();

  const [formId, setFormId] = React.useState(id('form'));
  React.useEffect(() => {
    if (form.id === '') form.id = id('form');
    setFormId(form.id);

    form.addEventListener('focusout', handleFocus);
    return (): void => form.removeEventListener('focusout', handleFocus);
  }, [form, id]);

  async function handleSubmit(
    event: SubmitEvent | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    addAnother = false
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
      .then(() => setSaveRequired(false))
      .then(
        () => setIsSaving(false),
        (error: { readonly status: number; errorHandled: boolean }) => {
          if (error.status !== Http.CONFLICT) return;
          error.errorHandled = true;
          hasSaveConflict();
        }
      );
  }

  React.useEffect(() => {
    const callback = (event: SubmitEvent): void =>
      void handleSubmit(event).catch(crash);
    form.addEventListener('submit', callback);
    return (): void => form.removeEventListener('submit', callback);
  }, [form, handleSubmit]);

  const ButtonComponent = saveBlocked ? Button.Red : Button.Orange;
  const SubmitComponent = saveBlocked ? Submit.Red : Submit.Orange;
  return (
    <>
      {typeof handleSaving === 'undefined' && isSaving ? (
        <LoadingScreen />
      ) : undefined}
      {canAddAnother && (
        <ButtonComponent
          className={saveBlocked ? 'cursor-not-allowed' : undefined}
          disabled={isSaving}
          onClick={(event): void => void handleSubmit(event, true).catch(crash)}
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
            {Array.from(model.saveBlockers.blockingResources, (resource) => (
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
