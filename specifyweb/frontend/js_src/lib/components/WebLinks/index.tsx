import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import _ from 'underscore';

import { useAsyncState } from '../../hooks/useAsyncState';
import { ajax } from '../../utils/ajax';
import { isExternalUrl } from '../../utils/ajax/helpers';
import type { IR, RA } from '../../utils/types';
import {
  caseInsensitiveHash,
  keysToLowerCase,
  removeKey,
} from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import type { AnySchema, AnyTree } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import { serializeResource } from '../DataModel/serializers';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { Tables } from '../DataModel/types';
import { UiField } from '../FormFields/Field';
import type { FormType } from '../FormParse';
import { load } from '../InitialContext';
import { getIcon, unknownIcon } from '../InitialContext/icons';
import { formatUrl } from '../Router/queryString';
import { xmlToSpec } from '../Syncer/xmlUtils';
import type { WebLink } from './spec';
import { webLinksSpec } from './spec';

export const webLinks = Promise.all([
  load<Element>(
    formatUrl('/context/app.resource', { name: 'WebLinks' }),
    'text/xml'
  ),
  import('../DataModel/tables').then(async ({ fetchContext }) => fetchContext),
]).then(([xml]) =>
  Object.fromEntries(
    xmlToSpec(xml, webLinksSpec()).webLinks.map(
      (webLink) => [webLink.name, webLink] as const
    )
  )
);

const specialResourcesFields: {
  readonly [TABLE_NAME in keyof Tables]?: (
    resource: SpecifyResource<Tables[TABLE_NAME]>
  ) => Promise<IR<string | undefined>>;
} = {
  Taxon: async (resource) =>
    fetchTreePath(resource).then((path) => ({
      genus: path?.Genus?.name,
      species: path?.Species?.name,
    })),
};

const fetchTreePath = async (treeResource: SpecifyResource<AnyTree>) =>
  typeof treeResource.id === 'number'
    ? ajax<{
        readonly Genus?: {
          readonly name: string;
        };
        readonly Species?: {
          readonly name: string;
        };
      }>(
        `/api/specify_tree/${treeResource.specifyTable.name.toLowerCase()}/${
          treeResource.id
        }/path/`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      ).then(({ data }) => data)
    : undefined;

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
  readonly webLink: string | undefined;
  readonly icon: string;
  readonly formType: FormType;
}): JSX.Element {
  const definition = useDefinition(
    resource?.specifyTable,
    field?.name,
    webLink
  );

  const [{ url, isExternal }, setUrl] = React.useState<{
    readonly url: string | undefined;
    readonly isExternal: boolean;
  }>({ url: undefined, isExternal: false });

  React.useEffect(() => {
    if (
      definition === undefined ||
      definition === false ||
      resource === undefined
    )
      return;
    const { args, template } = definition;

    async function buildUrl(): Promise<string> {
      if (resource === undefined) return '';
      let parameters = Object.fromEntries(
        args.map((name) => [name, undefined]) ?? []
      );
      parameters = {
        ...parameters,
        ...keysToLowerCase(parameters),
        // Lower case variants
        ...resource.toJSON(),
        // Camel case variants
        ...removeKey(serializeResource(resource), '_tableName'),
        ...(await specialResourcesFields?.[resource.specifyTable.name]),
      };
      return _.template(template)({
        ...parameters,
        _this: parameters[field?.name ?? ''],
      });
    }

    return resourceOn(
      resource,
      'change',
      (): void =>
        void buildUrl().then((url) =>
          setUrl({
            url,
            isExternal: isExternalUrl(url),
          })
        ),
      true
    );
  }, [resource, field?.name, definition, formType]);

  const image = (
    <img
      alt={typeof definition === 'object' ? definition.description : webLink}
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
          onClick={undefined}
        >
          {image}
        </Component>
      ) : undefined}
    </div>
  );
}

type ParsedWebLink = {
  readonly description: LocalizedString;
  readonly template: string;
  readonly args: RA<string>;
  readonly isExternal: boolean;
};

function useDefinition(
  table: SpecifyTable | undefined,
  fieldName: string | undefined,
  webLink: string | undefined
): ParsedWebLink | false | undefined {
  const [definition] = useAsyncState<ParsedWebLink | false>(
    React.useCallback(async () => {
      const fieldInfo = table?.getField(fieldName ?? '');
      const webLinkName = fieldInfo?.getWebLinkName() ?? webLink;
      const definition = await webLinks.then(
        (definitions) =>
          definitions[webLinkName ?? ''] ??
          caseInsensitiveHash(definitions, webLinkName ?? '')
      );
      if (typeof definition === 'object')
        return parseWebLink(definition) ?? false;

      if (table === undefined) return false;
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

export function parseWebLink({
  description,
  url,
  parameters,
}: WebLink): ParsedWebLink | undefined {
  const template =
    url
      ?.replaceAll(/<\s*this\s*>/gu, '<_this>')
      .replaceAll('AMP', '&')
      .replaceAll('<', '<%= ')
      .replaceAll('>', ' %>') ?? '';

  const args = parameters.map(({ name }) =>
    name === 'this' ? '_this' : name ?? ''
  );

  return template === undefined
    ? undefined
    : {
        description,
        template,
        args,
        isExternal: false,
      };
}
