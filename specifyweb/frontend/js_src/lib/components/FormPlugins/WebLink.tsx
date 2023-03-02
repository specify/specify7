import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import _ from 'underscore';

import { useAsyncState } from '../../hooks/useAsyncState';
import { isExternalUrl } from '../../utils/ajax/helpers';
import { fetchTreePath } from '../../utils/ajax/specifyApi';
import type { IR, RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { keysToLowerCase, removeKey } from '../../utils/utils';
import { xmlToString } from '../AppResources/codeMirrorLinters';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { serializeResource } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { Tables } from '../DataModel/types';
import { UiField } from '../FormFields/Field';
import type { FormMode, FormType } from '../FormParse';
import { load } from '../InitialContext';
import { getIcon, unknownIcon } from '../InitialContext/icons';
import { formatUrl } from '../Router/queryString';

export const webLinks = load<Element>(
  formatUrl('/context/app.resource', { name: 'WebLinks' }),
  'text/xml'
).then((xml) =>
  Object.fromEntries(
    Array.from(
      xml.querySelectorAll('vector > weblinkdef'),
      (definition) =>
        [
          defined(
            definition.querySelector(':scope > name')?.textContent ?? undefined,
            `WebLink definition is missing a name: ${xmlToString(definition)}`
          ),
          definition,
        ] as const
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

export function WebLink({
  resource,
  id,
  name,
  field,
  webLink,
  icon,
  formType,
  mode,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly id: string | undefined;
  readonly name: string | undefined;
  readonly field: LiteralField | Relationship | undefined;
  readonly webLink: string | undefined;
  readonly icon: string;
  readonly formType: FormType;
  readonly mode: FormMode;
}): JSX.Element {
  const definition = useDefinition(
    resource?.specifyModel,
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
        ...(await specialResourcesFields?.[resource.specifyModel.name]),
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
      alt={typeof definition === 'object' ? definition.title : url}
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
        <UiField
          field={field}
          id={id}
          mode={mode}
          name={name}
          resource={resource}
        />
      ) : undefined}
      {typeof definition === 'object' ? (
        <Component
          className="ring-1 ring-gray-400 disabled:ring-gray-500 dark:ring-0 disabled:dark:ring-neutral-500"
          href={url!}
          rel={isExternal ? 'noopener' : undefined}
          target={isExternal ? '_blank' : undefined}
          title={definition.title}
          onClick={undefined}
        >
          {image}
        </Component>
      ) : undefined}
    </div>
  );
}

type ParsedWebLink = {
  readonly title: LocalizedString;
  readonly template: string;
  readonly args: RA<string>;
  readonly isExternal: boolean;
};

function useDefinition(
  model: SpecifyModel | undefined,
  fieldName: string | undefined,
  webLink: string | undefined
): ParsedWebLink | false | undefined {
  const [definition] = useAsyncState<ParsedWebLink | false>(
    React.useCallback(async () => {
      const fieldInfo = model?.getField(fieldName ?? '');
      const webLinkName = fieldInfo?.getWebLinkName() ?? webLink;
      const definition = await webLinks.then(
        (definitions) => definitions[webLinkName ?? '']
      );
      if (typeof definition === 'object')
        return parseWebLink(definition) ?? false;

      if (model === undefined) return false;
      console.error("Couldn't determine WebLink", {
        tableName: model.name,
        fieldName,
        webLinkName,
      });
      return false;
    }, [model, fieldName, webLink]),
    false
  );
  return definition;
}

export function parseWebLink(definition: Element): ParsedWebLink | undefined {
  const title =
    (definition
      ?.querySelector(':scope > desc')
      ?.textContent?.trim() as LocalizedString) ?? '';

  const template =
    definition
      ?.querySelector('baseURLStr')
      ?.textContent?.trim()
      .replaceAll(/<\s*this\s*>/gu, '<_this>')
      .replaceAll('AMP', '&')
      .replaceAll('<', '<%= ')
      .replaceAll('>', ' %>') ?? '';

  const args = Array.from(
    definition?.querySelectorAll('weblinkdefarg > name') ?? [],
    (parameter) =>
      parameter.textContent === 'this' ? '_this' : parameter.textContent ?? ''
  );

  return template === undefined
    ? undefined
    : {
        title,
        template,
        args,
        isExternal: false,
      };
}
