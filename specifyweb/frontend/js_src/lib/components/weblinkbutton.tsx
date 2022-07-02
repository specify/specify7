import React from 'react';
import _ from 'underscore';

import type { Tables } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { serializeResource } from '../datamodelutils';
import { getIcon, unknownIcon } from '../icons';
import { load } from '../initialcontext';
import type { SpecifyResource } from '../legacytypes';
import type { FormMode, FormType } from '../parseform';
import { getTreePath } from '../specifyapi';
import type { IR } from '../types';
import { defined } from '../types';
import { Link } from './basic';
import { useAsyncState } from './hooks';
import { UiField } from './uifield';
import { isExternalUrl } from '../ajax';
import { resourceOn } from '../resource';
import { formatUrl } from '../querystring';
import { keysToLowerCase } from '../helpers';

export const webLinks =
  process.env.NODE_ENV === 'test'
    ? Promise.resolve<IR<Element>>({})
    : load<Element>(
        formatUrl('/context/app.resource', { name: 'WebLinks' }),
        'application/xml'
      ).then((xml) =>
        Object.fromEntries(
          Array.from(
            xml.querySelectorAll('vector > weblinkdef'),
            (definition) =>
              [
                defined(
                  definition.querySelector(':scope > name')?.textContent ??
                    undefined
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
    getTreePath(resource).then((path) => ({
      genus: path?.Genus?.name,
      species: path?.Species?.name,
    })),
};

export function WebLinkButton({
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
        ...serializeResource(resource),
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

  return (
    <div
      className={
        formType === 'formTable' ? undefined : 'print:hidden flex gap-x-2'
      }
    >
      {typeof data === 'object' ? (
        <>
          {formType === 'form' &&
          typeof fieldName === 'string' &&
          fieldName !== 'this' ? (
            <UiField
              resource={resource}
              fieldName={fieldName}
              mode={mode}
              id={id}
            />
          ) : undefined}
          <Link.Gray
            title={data.title}
            href={url}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener' : undefined}
          >
            <img
              src={getIcon(icon) ?? unknownIcon}
              className="max-w-[theme(spacing.10)] max-h-[theme(spacing.5)]"
              alt={data.title ?? url}
            />
          </Link.Gray>
        </>
      ) : undefined}
    </div>
  );
}
