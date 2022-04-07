import React from 'react';

import { Http } from '../ajax';
import type { AnySchema } from '../datamodelutils';
import { camelToHuman } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { defined } from '../types';
import { Button, className, H3, Submit, Ul } from './basic';
import { LoadingContext } from './contexts';
import { crash } from './errorboundary';
import { useBooleanState, useId, useUnloadProtect } from './hooks';
import { Dialog, LoadingScreen } from './modaldialog';

// TODO: handle case when there are save blockers for field that is not
//   rendered on the form
// TODO: move this logic into ResourceView, so that <form> and button is
//   defined in the same place
export function SaveButton<SCHEMA extends AnySchema = AnySchema>({
  resource,
  canAddAnother,
  form,
  onSaving: handleSaving,
  onSaved: handleSaved,
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
}): JSX.Element {
  const id = useId('save-button');
  const [saveRequired, setSaveRequired] = React.useState(resource.needsSaved);
  const unsetUnloadProtect = useUnloadProtect(
    saveRequired,
    formsText('unsavedFormUnloadProtect')
  );

  const [saveBlocked, setSaveBlocked] = React.useState(false);
  React.useEffect(() => {
    setSaveRequired(resource.needsSaved);
    const handleSaveRequired = (): void => setSaveRequired(true);
    resource.on('saverequired', handleSaveRequired);

    setSaveBlocked(false);

    function handleChanged(saveRequired = true): void {
      if (saveRequired) handleSaveRequired();
      const onlyDeferredBlockers = Array.from(
        resource.saveBlockers.blockingResources
      ).every((resource) => resource.saveBlockers.hasOnlyDeferredBlockers());
      setSaveBlocked(!onlyDeferredBlockers);
    }

    handleChanged(false);
    resource.on('blockerschanged', handleChanged);
    return (): void => {
      resource.off('saverequired', handleSaveRequired);
      resource.off('blockerschanged', handleChanged);
    };
  }, [resource]);

  const [isSaving, setIsSaving] = React.useState(false);
  const [showSaveBlockedDialog, setShowBlockedDialog] = React.useState(false);
  const [isSaveConflict, hasSaveConflict] = useBooleanState();

  const [formId, setFormId] = React.useState(id('form'));
  React.useEffect(() => {
    if (form.id === '') form.id = id('form');
    setFormId(form.id);
  }, [form, id]);

  async function handleSubmit(
    event: SubmitEvent | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    addAnother = false
  ): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (saveBlocked || (!saveRequired && !addAnother)) return;

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
    (saveRequired ? resource.save() : Promise.resolve())
      .then(() => {
        unsetUnloadProtect();
        handleSaved?.({
          newResource,
          wasNew,
        });
      })
      .then(() => setSaveRequired(false))
      .then(() => resource.trigger('saved'))
      .then(
        () => setIsSaving(false),
        (error: { readonly status: number; errorHandled: boolean }) => {
          if (error.status !== Http.CONFLICT) return;
          error.errorHandled = true;
          hasSaveConflict();
        }
      );
  }

  const loading = React.useContext(LoadingContext);
  React.useEffect(() => {
    const callback = (event: SubmitEvent): void => loading(handleSubmit(event));
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
          {saveRequired || resource.isNew()
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
