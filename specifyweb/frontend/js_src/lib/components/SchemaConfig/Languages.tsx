import React from 'react';
import { useOutletContext } from 'react-router';
import { useNavigate } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { hasToolPermission } from '../Permissions/helpers';
import { useId } from '../../hooks/hooks';
import { Dialog } from '../Molecules/Dialog';
import type { SchemaData } from './SetupHooks';
import { Link } from '../Atoms/Link';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';

export function ChooseSchemaLanguage(): JSX.Element {
  const schemaData = useOutletContext<SchemaData>();
  const navigate = useNavigate();
  return (
    <Dialog
      buttons={
        <>
          {hasToolPermission('schemaConfig', 'create') && (
            <Link.Blue href="/specify/schema-config/add-language/">
              {commonText('addLanguage')}
            </Link.Blue>
          )}
          <span className="-ml-2 flex-1" />
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
        </>
      }
      header={commonText('schemaConfig')}
      onClose={(): void => navigate('/specify/')}
    >
      {commonText('language')}
      <Ul>
        {Object.entries(schemaData.languages).map(([code, label]) => (
          <li key={code}>
            <Link.Default
              className="font-bold"
              href={`/specify/schema-config/${code}/`}
              role="link"
            >
              {label}
            </Link.Default>
          </li>
        ))}
      </Ul>
    </Dialog>
  );
}

export function AddLanguage(): JSX.Element {
  const id = useId('schema-config-add-language');
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const [language, setLanguage] = React.useState<string>('');
  const [country, setCountry] = React.useState<string>('');
  const navigate = useNavigate();
  return (
    <Dialog
      buttons={
        <>
          <Button.Gray
            onClick={(): void => navigate('/specify/schema-config/')}
          >
            {commonText('back')}
          </Button.Gray>
          <Submit.Blue form={id('form')}>{commonText('add')}</Submit.Blue>
        </>
      }
      header={commonText('addLanguageDialogHeader')}
      onClose={(): void => navigate('/specify/')}
    >
      <Form
        className="contents"
        forwardRef={formRef}
        id={id('form')}
        onSubmit={(): void => {
          const code = `${language.toLowerCase()}${
            country === '' ? '' : `-${country.toLowerCase()}`
          }`;
          navigate(`/specify/schema-config/${code}/`);
        }}
      >
        <Label.Generic>
          {commonText('language')}
          <Input.Text
            maxLength={2}
            minLength={2}
            placeholder="en"
            required
            value={language}
            onValueChange={setLanguage}
          />
        </Label.Generic>
        <Label.Generic>
          {commonText('country')}
          <Input.Text
            maxLength={2}
            minLength={2}
            placeholder="US"
            value={country}
            onValueChange={setCountry}
          />
        </Label.Generic>
      </Form>
    </Dialog>
  );
}
