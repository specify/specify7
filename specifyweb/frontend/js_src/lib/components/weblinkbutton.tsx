import React from 'react';
import _ from 'underscore';

import { isExternalUrl } from '../ajax';
import type { Tables } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { keysToLowerCase, serializeResource } from '../datamodelutils';
import { getIcon } from '../icons';
import { load } from '../initialcontext';
import type { SpecifyResource } from '../legacytypes';
import type { FormMode, FormType } from '../parseform';
import { getTreePath } from '../specifyapi';
import type { IR } from '../types';
import { defined } from '../types';
import { Link } from './basic';
import { useAsyncState } from './hooks';
import { UiField } from './uifield';

export const webLinks = load<Element>(
  '/context/app.resource?name=WebLinks',
  'application/xml'
).then((xml) =>
  Object.fromEntries(
    Array.from(
      xml.querySelectorAll('vector > webLinkDef'),
      (definition) =>
        [
          defined(definition.querySelector('> name')?.textContent ?? undefined),
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
  const [data] = useAsyncState(
    React.useCallback(async () => {
      const fieldInfo = resource.specifyModel.getField(fieldName ?? '');
      const webLinkName = fieldInfo?.getWebLinkName() ?? webLink;
      const definition = await webLinks.then(
        (definitions) => definitions[webLinkName ?? '']
      );
      const title = definition?.querySelector('> desc')?.textContent ?? '';
      if (typeof definition === 'undefined')
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
    }, [resource, fieldName, webLink])
  );

  const [{ url, isExternal }, setUrl] = React.useState<{
    readonly url: string | undefined;
    readonly isExternal: boolean;
  }>({ url: undefined, isExternal: false });

  React.useEffect(() => {
    if (typeof data === 'undefined') return;

    async function buildUrl(): Promise<string> {
      const template =
        data?.definition
          .querySelector('baseURLStr')
          ?.textContent?.replace(/<\s*this\s*>/g, '<_this>')
          .replaceAll('AMP', '&')
          .replaceAll('<', '<%= ')
          .replaceAll('>', ' %>') ?? '';

      let args = Object.fromEntries(
        Array.from(
          data?.definition.querySelectorAll('weblinkdefarg > name') ?? [],
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

    const setLink = (): void =>
      void buildUrl().then((url) =>
        setUrl({
          url,
          isExternal: isExternalUrl(url),
        })
      );

    resource.on('change', setLink);
    return (): void => resource.off('change', setLink);
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
          <Link.LikeButton
            title={data.title}
            href={url}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener' : undefined}
          >
            <img
              src={getIcon(icon)}
              className="max-w-[40px] max-h-[20px]"
              alt={data.title ?? url}
            />
          </Link.LikeButton>
        </>
      ) : undefined}
    </div>
  );
}
