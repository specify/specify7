import React from 'react';
import _ from 'underscore';

import { isExternalUrl } from '../../utils/ajax/helpers';
import type { Tables } from '../DataModel/types';
import { serializeResource } from '../DataModel/helpers';
import { keysToLowerCase, removeKey } from '../../utils/utils';
import { getIcon, unknownIcon } from '../InitialContext/icons';
import { load } from '../InitialContext';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { FormMode, FormType } from '../FormParse';
import { formatUrl } from '../Router/queryString';
import { resourceOn } from '../DataModel/resource';
import { fetchTreePath } from '../../utils/ajax/specifyApi';
import type { IR } from '../../utils/types';
import { defined } from '../../utils/types';
import { UiField } from '../FormFields/Field';
import { Link } from '../Atoms/Link';
import { Button } from '../Atoms/Button';
import { useAsyncState } from '../../hooks/useAsyncState';
import { AnySchema } from '../DataModel/helperTypes';
import { xmlToString } from '../AppResources/codeMirrorLinters';

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
  fieldName,
  webLink,
  icon,
  formType,
  mode,
  id,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly fieldName: string | undefined;
  readonly webLink: string | undefined;
  readonly icon: string;
  readonly formType: FormType;
  readonly mode: FormMode;
  readonly id: string | undefined;
}): JSX.Element {
  const [data] = useAsyncState<{
    readonly title: string;
    readonly definition: Element | undefined;
    readonly isExternal: boolean;
  }>(
    React.useCallback(async () => {
      const fieldInfo = resource.specifyModel.getField(fieldName ?? '');
      const webLinkName = fieldInfo?.getWebLinkName() ?? webLink;
      const definition = await webLinks.then(
        (definitions) => definitions[webLinkName ?? '']
      );
      const title =
        definition?.querySelector(':scope > desc')?.textContent ?? '';
      if (definition === undefined)
        console.error("Couldn't determine weblink", {
          resource,
          fieldName,
          webLinkName,
        });

      return {
        title,
        definition,
        isExternal: false,
      };
    }, [resource, fieldName, webLink]),
    false
  );

  const [{ url, isExternal }, setUrl] = React.useState<{
    readonly url: string | undefined;
    readonly isExternal: boolean;
  }>({ url: undefined, isExternal: false });

  React.useEffect(() => {
    if (data === undefined) return;

    async function buildUrl(): Promise<string> {
      const template =
        data?.definition
          ?.querySelector('baseURLStr')
          ?.textContent?.replace(/<\s*this\s*>/g, '<_this>')
          .replaceAll('AMP', '&')
          .replaceAll('<', '<%= ')
          .replaceAll('>', ' %>') ?? '';

      let args = Object.fromEntries(
        Array.from(
          data?.definition?.querySelectorAll('weblinkdefarg > name') ?? [],
          (parameter) => [
            parameter.textContent === 'this'
              ? '_this'
              : parameter.textContent ?? '',
            undefined,
          ]
        )
      );
      args = {
        ...args,
        ...keysToLowerCase(args),
        // Lower case variants
        ...resource.toJSON(),
        // Camel case variants
        ...removeKey(serializeResource(resource), '_tableName'),
        ...(await specialResourcesFields?.[resource.specifyModel.name]),
      };
      return _.template(template)({
        ...args,
        _this: args[fieldName ?? ''],
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
  }, [resource, fieldName, data, formType]);

  const image = (
    <img
      alt={data?.title ?? url}
      className="max-h-[theme(spacing.5)] max-w-[theme(spacing.10)]"
      src={getIcon(icon) ?? unknownIcon}
    />
  );
  return (
    <div
      className={
        formType === 'formTable' ? undefined : 'flex gap-2 print:hidden'
      }
    >
      {typeof data === 'object' ? (
        <>
          {formType === 'form' &&
          typeof fieldName === 'string' &&
          fieldName !== 'this' ? (
            <UiField
              fieldName={fieldName}
              id={id}
              mode={mode}
              resource={resource}
            />
          ) : undefined}
          {typeof url === 'string' && url.length > 0 ? (
            <Link.Gray
              href={url}
              rel={isExternal ? 'noopener' : undefined}
              target={isExternal ? '_blank' : undefined}
              title={data.title}
            >
              {image}
            </Link.Gray>
          ) : (
            <Button.Gray title={data.title} onClick={undefined}>
              {image}
            </Button.Gray>
          )}
        </>
      ) : undefined}
    </div>
  );
}
