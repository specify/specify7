import React from 'react';
import { useOutletContext } from 'react-router';
import { useNavigate } from 'react-router-dom';

import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { localized } from '../../utils/types';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { Dialog } from '../Molecules/Dialog';
import { hasToolPermission } from '../Permissions/helpers';
import type { SchemaData } from './schemaData';

export const languageSeparator = '-';

export function ChooseSchemaLanguage(): JSX.Element {
  const schemaData = useOutletContext<SchemaData>();
  const navigate = useNavigate();
  return (
    <Dialog
      buttons={
        <>
          {hasToolPermission('schemaConfig', 'create') && (
            <Link.Info href="/specify/schema-config/add-language/">
              {schemaText.addLanguage()}
            </Link.Info>
          )}
          <span className="-ml-2 flex-1" />
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        </>
      }
      header={schemaText.schemaConfig()}
      onClose={(): void => navigate('/specify/')}
    >
      {commonText.language()}
      <Ul>
        {Object.entries(schemaData.languages).map(([code, label]) => (
          <li key={code}>
            <Link.Default
              className="font-bold"
              href={`/specify/schema-config/${code}/`}
            >
              {label.includes('(')
                ? label
                : localized(
                    `${label} (${code.split(languageSeparator).at(-1) ?? code})`
                  )}
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
          <Button.Secondary
            onClick={(): void => navigate('/specify/schema-config/')}
          >
            {commonText.back()}
          </Button.Secondary>
          <Submit.Info form={id('form')}>{commonText.add()}</Submit.Info>
        </>
      }
      header={schemaText.addLanguage()}
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
        <Label.Block>
          {commonText.language()}
          <Input.Text
            maxLength={2}
            minLength={2}
            placeholder="en"
            required
            value={language}
            onValueChange={setLanguage}
          />
        </Label.Block>
        <Label.Block>
          {commonText.country()}
          <Input.Text
            maxLength={2}
            minLength={2}
            placeholder="US"
            value={country}
            onValueChange={setCountry}
          />
        </Label.Block>
      </Form>
    </Dialog>
  );
}
