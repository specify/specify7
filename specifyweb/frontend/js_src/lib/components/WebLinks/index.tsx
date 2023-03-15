import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { getAppResourceUrl, isExternalUrl } from '../../utils/ajax/helpers';
import type { GetSet, IR, RA } from '../../utils/types';
import { caseInsensitiveHash } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { fetchPathAsString, format } from '../Formatters/formatters';
import { UiField } from '../FormFields/Field';
import type { FormType } from '../FormParse';
import { load } from '../InitialContext';
import { getIcon, unknownIcon } from '../InitialContext/icons';
import { Dialog } from '../Molecules/Dialog';
import { xmlToSpec } from '../Syncer/xmlUtils';
import type { WebLink } from './spec';
import { webLinksSpec } from './spec';

export const webLinks = Promise.all([
  load<Element>(getAppResourceUrl('WebLinks'), 'text/xml'),
  import('../DataModel/tables').then(async ({ fetchContext }) => fetchContext),
]).then(([xml]) =>
  Object.fromEntries(
    xmlToSpec(xml, webLinksSpec()).webLinks.map(
      (webLink) => [webLink.name, webLink] as const
    )
  )
);

export function WebLinkField({
  resource,
  id,
  name,
  field,
  webLink,
  icon,
  formType,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly id: string | undefined;
  readonly name: string | undefined;
  readonly field: LiteralField | Relationship | undefined;
  readonly webLink: WebLink | string | undefined;
  readonly icon: string;
  readonly formType: FormType;
}): JSX.Element {
  const definition = useDefinition(
    resource?.specifyTable,
    field?.name,
    webLink
  );

  const [builtUrl, setUrl] = React.useState<
    RA<string | { readonly prompt: string }> | undefined
  >(undefined);
  const [prompt, setPrompt] = React.useState<IR<string | undefined>>({});
  const url = builtUrl
    ?.map((part) =>
      typeof part === 'string' ? part : prompt?.[part.prompt] ?? ''
    )
    .join('');
  const [showPrompt, setShowPrompt] = React.useState(false);
  const isExternal = React.useMemo(
    () => url !== undefined && isExternalUrl(url),
    [url]
  );

  React.useEffect(() => {
    if (
      definition === undefined ||
      definition === false ||
      resource === undefined
    )
      return;
    const { parts } = definition;

    const buildUrl = async (): Promise<
      RA<string | { readonly prompt: string }>
    > =>
      resource === undefined
        ? []
        : Promise.all(
            parts.map((part) =>
              part.type === 'Field'
                ? fetchPathAsString(resource, part.field)
                : part.type === 'ThisField'
                ? typeof field === 'object'
                  ? fetchPathAsString(resource, [field])
                  : undefined
                : part.type === 'PromptField'
                ? { prompt: part.label }
                : part.type === 'FormattedResource'
                ? format(resource, part.formatter, false)
                : part.value
            )
          ).then((values) => values.map((value) => value ?? ''));

    return resourceOn(
      resource,
      'change',
      (): void => void buildUrl().then(setUrl),
      true
    );
  }, [resource, field, definition, formType]);

  const image = (
    <img
      alt={
        typeof definition === 'object'
          ? definition.description
          : typeof webLink === 'object'
          ? webLink.name
          : webLink
      }
      className="max-h-[theme(spacing.5)] max-w-[theme(spacing.10)]"
      src={getIcon(icon) ?? unknownIcon}
    />
  );
  const Component =
    typeof url === 'string' && url.length > 0 ? Link.Gray : Button.Gray;
  return (
    <div
      className={
        formType === 'formTable' ? undefined : 'flex gap-2 print:hidden'
      }
    >
      {formType === 'form' && typeof field === 'object' ? (
        <UiField field={field} id={id} name={name} resource={resource} />
      ) : undefined}
      {typeof definition === 'object' ? (
        <Component
          className="ring-1 ring-gray-400 disabled:ring-gray-500 dark:ring-0 disabled:dark:ring-neutral-500"
          href={url!}
          rel={isExternal ? 'noopener' : undefined}
          target={isExternal ? '_blank' : undefined}
          title={definition.description}
          onClick={(event): void => {
            if (url === undefined) return;
            if (definition.parts.some(({ type }) => type === 'PromptField')) {
              event.preventDefault();
              setShowPrompt(true);
            }
          }}
        >
          {image}
          {showPrompt && (
            <Prompt
              label={definition.name}
              parts={definition.parts}
              prompt={[prompt, setPrompt]}
              url={url}
              onClose={(): void => setShowPrompt(false)}
            />
          )}
        </Component>
      ) : undefined}
    </div>
  );
}

function useDefinition(
  table: SpecifyTable | undefined,
  fieldName: string | undefined,
  webLink: WebLink | string | undefined
): WebLink | false | undefined {
  const [definition] = useAsyncState<WebLink | false>(
    React.useCallback(async () => {
      if (typeof webLink === 'object') return webLink;
      const fieldInfo = table?.getField(fieldName ?? '');
      const webLinkName = webLink ?? fieldInfo?.getWebLinkName();
      const definition = await webLinks.then((definitions) =>
        caseInsensitiveHash(definitions, webLinkName ?? '')
      );
      if (typeof definition === 'object') return definition;

      if (table !== undefined)
        console.error("Couldn't determine WebLink", {
          tableName: table.name,
          fieldName,
          webLinkName,
        });
      return false;
    }, [table, fieldName, webLink]),
    false
  );
  return definition;
}

function Prompt({
  label,
  parts,
  prompt: [prompt, setPrompt],
  url,
  onClose: handleClose,
}: {
  readonly label: string;
  readonly parts: WebLink['parts'];
  readonly prompt: GetSet<IR<string | undefined>>;
  readonly url: string | undefined;
  readonly onClose: () => void;
}): JSX.Element {
  const id = useId('web-link-prompt');
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText.open()}</Submit.Blue>
        </>
      }
      header={label}
      onClose={handleClose}
    >
      <Form
        id={id('form')}
        onSubmit={(): void => {
          if (typeof url === 'string') window.open(url, '_blank');
          handleClose();
        }}
      >
        <Ul className="flex flex-col gap-2">
          {parts.map((part, index) =>
            part.type === 'PromptField' ? (
              <li key={index}>
                <Label.Block>
                  {part.label}
                  <Input.Text
                    value={prompt[part.label] ?? ''}
                    onValueChange={(value): void =>
                      setPrompt({
                        ...prompt,
                        [part.label]: value,
                      })
                    }
                  />
                </Label.Block>
              </li>
            ) : undefined
          )}
        </Ul>
      </Form>
    </Dialog>
  );
}
