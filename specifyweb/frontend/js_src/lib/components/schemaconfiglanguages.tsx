import React from 'react';

import { commonText } from '../localization/common';
import { hasToolPermission } from '../permissions';
import { Button, Form, Input, Label, Submit, Ul } from './basic';
import { useBooleanState, useId } from './hooks';
import { Dialog } from './modaldialog';
import type { SchemaData } from './schemaconfigsetuphooks';

export function ChooseSchemaLanguage({
  languages,
  onClose: handleClose,
  onSelected: handleSelected,
}: {
  readonly languages: SchemaData['languages'];
  readonly onClose: () => void;
  readonly onSelected: (languageCode: string) => void;
}): JSX.Element {
  const [isAdding, handleAdding, handleNoAdding] = useBooleanState();
  return isAdding ? (
    <AddLanguage
      onClose={handleClose}
      onGoBack={handleNoAdding}
      onAddLanguage={handleSelected}
    />
  ) : (
    <Dialog
      header={commonText('schemaConfig')}
      onClose={handleClose}
      buttons={
        <>
          {hasToolPermission('schemaConfig', 'create') && (
            <Button.Blue onClick={handleAdding}>
              {commonText('addLanguage')}
            </Button.Blue>
          )}
          <span className="flex-1 -ml-2" />
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
        </>
      }
    >
      {commonText('language')}
      <Ul>
        {Object.entries(languages).map(([code, label]) => (
          <li key={code}>
            <Button.LikeLink
              role="link"
              className="font-bold"
              onClick={(): void => handleSelected(code)}
            >
              {label}
            </Button.LikeLink>
          </li>
        ))}
      </Ul>
    </Dialog>
  );
}

function AddLanguage({
  onClose: handleClose,
  onGoBack: handleGoBack,
  onAddLanguage: handleAddLanguage,
}: {
  readonly onClose: () => void;
  readonly onGoBack: () => void;
  readonly onAddLanguage: (language: string) => void;
}): JSX.Element {
  const id = useId('schema-config-add-language');
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const [language, setLanguage] = React.useState<string>('');
  const [country, setCountry] = React.useState<string>('');
  return (
    <Dialog
      header={commonText('addLanguageDialogHeader')}
      onClose={handleClose}
      buttons={
        <>
          <Button.Gray onClick={handleGoBack}>{commonText('back')}</Button.Gray>
          <Submit.Blue form={id('form')}>{commonText('add')}</Submit.Blue>
        </>
      }
    >
      <Form
        className="contents"
        forwardRef={formRef}
        id={id('form')}
        onSubmit={(): void =>
          handleAddLanguage(
            `${language.toLowerCase()}${
              country === '' ? '' : `-${country.toLowerCase()}`
            }`
          )
        }
      >
        <Label.Generic>
          {commonText('language')}
          <Input.Text
            required
            minLength={2}
            maxLength={2}
            placeholder="en"
            value={language}
            onValueChange={setLanguage}
          />
        </Label.Generic>
        <Label.Generic>
          {commonText('country')}
          <Input.Text
            minLength={2}
            maxLength={2}
            placeholder="US"
            value={country}
            onValueChange={setCountry}
          />
        </Label.Generic>
      </Form>
    </Dialog>
  );
}
