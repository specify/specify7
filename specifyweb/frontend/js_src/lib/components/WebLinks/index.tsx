import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { getAppResourceUrl, isExternalUrl } from '../../utils/ajax/helpers';
import type { IR, RA } from '../../utils/types';
import { caseInsensitiveHash } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
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
import { xmlToSpec } from '../Syncer/xmlUtils';
import { WebLinksContext } from './Editor';
import type { WebLink } from './spec';
import { webLinksSpec } from './spec';

export const webLinks = Promise.all([
  load<Element>(getAppResourceUrl('WebLinks'), 'text/xml'),
  import('../DataModel/tables').then(async ({ fetchContext }) => fetchContext),
]).then(([xml]) => xmlToSpec(xml, webLinksSpec()).webLinks);

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

  const [builtUrl, setUrl] = React.useState<RA<string> | undefined>(undefined);
  const url = builtUrl
    ?.map((part) => (typeof part === 'string' ? part : ''))
    .join('');
  const isExternal = React.useMemo(() => {
    try {
      return url !== undefined && isExternalUrl(url);
    } catch {
      return true;
    }
  }, [url]);

  React.useEffect(() => {
    if (
      definition === undefined ||
      definition === false ||
      resource === undefined
    )
      return;
    const { parts } = definition;

    const buildUrl = async (): Promise<RA<string>> =>
      resource === undefined
        ? []
        : Promise.all(
            parts.map(async (part) =>
              part.type === 'Field'
                ? fetchPathAsString(resource, part.field)
                : part.type === 'ThisField'
                  ? typeof field === 'object'
                    ? fetchPathAsString(resource, [field])
                    : undefined
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
    typeof url === 'string' && url.length > 0
      ? Link.Secondary
      : Button.Secondary;

  const isInEditor = React.useContext(WebLinksContext) !== undefined;

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
        <>
          <Component
            className="ring-1 ring-gray-400 disabled:ring-gray-500 dark:ring-0 disabled:dark:ring-neutral-500"
            href={url!}
            rel={isExternal ? 'noopener' : undefined}
            target={isExternal ? '_blank' : undefined}
            title={definition.description}
            onClick={undefined}
          >
            {image}
          </Component>
          {isInEditor && <div className="flex items-center">{url}</div>}
        </>
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
      const definitions = await webLinks;

      if (webLinkName === undefined) {
        console.error(
          'Field is not a WebLink\nIs it set as a WebLink in Schema Config?',
          {
            tableName: table?.name,
            fieldName,
          }
        );
        return false;
      }

      const indexed: IR<WebLink> = Object.fromEntries(
        definitions.map((definition) => [definition.name, definition] as const)
      );
      const definition = caseInsensitiveHash(indexed, webLinkName);
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
