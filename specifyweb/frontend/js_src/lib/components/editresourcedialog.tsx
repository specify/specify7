import React from 'react';

import { error } from '../assert';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import populateForm from '../populateform';
import specifyForm from '../specifyform';
import { defined } from '../types';
import { Button, FormFooter } from './basic';
import { DeleteButton } from './deletebutton';
import { Dialog, LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { SaveButton } from './savebutton';

export function EditResourceDialog<SCHEMA extends AnySchema = AnySchema>({
  resource,
  deletionMessage,
  onSaving: handleSaving,
  onSaved: handleSaved,
  onClose: handleClose,
  extraButton,
  readOnly = false,
}: {
  readonly resource: SpecifyResource<SCHEMA>;
  readonly deletionMessage?: string;
  readonly onSaving?: () => void;
  readonly onSaved: () => void;
  readonly onClose: () => void;
  // TODO: remove this once RecordSetsDialog is converted to React
  readonly extraButton?: {
    readonly label: string;
    readonly onClick: () => void;
  };
  readonly readOnly?: boolean;
}): JSX.Element {
  const [isLoading, setIsLoading] = React.useState(true);
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const [form, setForm] = React.useState<HTMLFormElement | undefined>(
    undefined
  );

  React.useEffect(() => {
    if (typeof container === null) return;

    const viewName = resource.specifyModel.view ?? resource.specifyModel.name;
    // TODO: convert this to React
    specifyForm.buildViewByName(viewName).then((form) => {
      setIsLoading(false);

      form.find('.specify-form-header:first').remove();

      populateForm(form, resource);
      const formElement = form[0] as HTMLFormElement;
      defined(container ?? undefined).append(formElement);
      setForm(formElement);

      const resourceLabel = resource.specifyModel.getLocalizedName();
      setTitle(
        resource.isNew()
          ? commonText('newResourceTitle')(resourceLabel)
          : resourceLabel
      );
      return undefined;
    }, error);
  }, [resource, container]);

  const [title, setTitle] = React.useState('');

  return isLoading ? (
    <LoadingScreen />
  ) : (
    <Dialog
      modal={true}
      header={title}
      onClose={handleClose}
      buttons={
        <FormFooter>
          {!resource.isNew() && !readOnly ? (
            <DeleteButton model={resource} deletionMessage={deletionMessage} />
          ) : undefined}
          {typeof extraButton === 'object' && (
            <Button.Gray onClick={extraButton.onClick}>
              {extraButton.label}
            </Button.Gray>
          )}
          {!readOnly && form !== undefined ? (
            <SaveButton
              model={resource}
              form={form}
              onSaving={handleSaving}
              onSaved={handleSaved}
            />
          ) : undefined}
        </FormFooter>
      }
    >
      <div ref={setContainer} />
    </Dialog>
  );
}

export default createBackboneView(EditResourceDialog);
