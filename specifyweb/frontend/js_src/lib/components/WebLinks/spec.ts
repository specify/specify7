import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { removeKey } from '../../utils/utils';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecToJson } from '../Syncer';
import { pipe, syncer } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import { createSimpleXmlNode } from '../Syncer/xmlToJson';
import { createXmlSpec } from '../Syncer/xmlUtils';

export const webLinksSpec = f.store(() =>
  createXmlSpec({
    webLinks: pipe(
      syncers.xmlChildren('weblinkdef'),
      syncers.map(
        pipe(
          syncers.object(webLinkSpec()),
          syncer(
            (webLink) => ({
              ...removeKey(webLink, 'url', 'parameters'),
              parts: parseDefinition(webLink),
            }),
            ({ parts, ...webLink }) => ({
              ...webLink,
              ...reconstructWeblink(parts),
            })
          )
        )
      )
    ),
  })
);

export type WebLink = SpecToJson<
  ReturnType<typeof webLinksSpec>
>['webLinks'][number];

type RawWebLink = SpecToJson<ReturnType<typeof webLinkSpec>>;

const webLinkSpec = f.store(() =>
  createXmlSpec({
    name: pipe(
      syncers.xmlChild('name'),
      syncers.maybe(syncers.xmlContent),
      syncers.default<LocalizedString>('')
    ),
    table: pipe(
      syncers.xmlChild('tableName', 'optional'),
      syncers.maybe(syncers.xmlContent),
      syncers.maybe(syncers.tableName)
    ),
    description: pipe(
      syncers.xmlChild('desc'),
      syncers.maybe(syncers.xmlContent),
      syncers.default<LocalizedString>('')
    ),
    url: pipe(
      syncers.xmlChild('baseURLStr'),
      syncers.maybe(syncers.xmlContent)
    ),
    parameters: pipe(
      syncers.xmlChild('args'),
      syncers.default(() => createSimpleXmlNode('args')),
      syncers.xmlChildren('weblinkdefarg'),
      syncers.map(syncers.object(argumentSpec()))
    ),
    usages: pipe(
      syncers.xmlChild('usedByList'),
      syncers.default(() => createSimpleXmlNode('usedByList')),
      syncers.xmlChildren('usedby'),
      syncers.map(syncers.object(usedBySpec()))
    ),
  })
);

const argumentSpec = f.store(() =>
  createXmlSpec({
    name: pipe(
      syncers.xmlChild('name'),
      syncers.maybe(syncers.xmlContent),
      syncers.default<LocalizedString>('')
    ),
    title: pipe(
      syncers.xmlChild('title', 'optional'),
      syncers.maybe(syncers.xmlContent),
      syncers.default<LocalizedString>('')
    ),
    shouldPrompt: pipe(
      syncers.xmlChild('prompt'),
      syncers.maybe(syncers.xmlContent),
      syncers.default<LocalizedString>(''),
      syncers.toBoolean
    ),
    isEditable: pipe(
      syncers.xmlChild('isEditable', 'optional'),
      syncers.maybe(syncers.xmlContent),
      syncers.default<LocalizedString>(''),
      syncers.toBoolean,
      /**
       * "isEditable" appears unused in Specify 6, but is always set to
       * false
       */
      syncer(f.id, () => false)
    ),
  })
);

const usedBySpec = f.store(() =>
  createXmlSpec({
    table: pipe(
      syncers.xmlChild('tableName'),
      syncers.maybe(syncers.xmlContent),
      syncers.default<LocalizedString>(''),
      syncers.tableName
    ),
    fieldName: pipe(
      syncers.xmlChild('fieldName'),
      syncers.maybe(syncers.xmlContent)
    ),
  })
);

type ParsedWebLink =
  | State<'Field', { readonly field: RA<LiteralField | Relationship> }>
  | State<'FormattedResource', { readonly formatter: string }>
  | State<'PromptField', { readonly label: string }>
  | State<'ThisField'>
  | State<'UrlPart', { readonly value: string }>;

const reArgument = /(?<argument><[^>]+>)/u;

const parseDefinition = (item: RawWebLink): RA<ParsedWebLink> =>
  (item.url ?? '')
    .replaceAll('AMP', '&')
    .split(reArgument)
    .filter((part) => part.length > 0)
    .map((part) =>
      part.startsWith('<') && part.endsWith('>')
        ? parseField(item, part.slice(1, -1))
        : {
            type: 'UrlPart',
            value: part,
          }
    );

const formatter = 'formatter_';

function parseField(item: RawWebLink, part: string): ParsedWebLink {
  if (item.table !== undefined) {
    const field = item.table.getFields(part);
    if (Array.isArray(field)) return { type: 'Field', field };
  }
  if (part.trim() === 'this') return { type: 'ThisField' };
  const field = item.parameters.find(({ name }) => name === part.trim());
  if (typeof field === 'object' && field.name.startsWith(formatter))
    return {
      type: 'FormattedResource',
      formatter: field.title,
    };
  return {
    type: 'PromptField',
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    label: field?.title || field?.name || part,
  };
}

function reconstructWeblink(
  parts: RA<ParsedWebLink>
): Pick<RawWebLink, 'parameters' | 'url'> {
  const augmented = parts
    .filter((part) => part.type !== 'Field' || part.field.length > 0)
    .map((parameter, index) =>
      parameter.type === 'Field'
        ? {
            name: parameter.field.map(({ name }) => name).join('.'),
            title: parameter.field.map(({ label }) => label).join(' > '),
            shouldPrompt: false,
          }
        : parameter.type === 'PromptField'
        ? {
            name: `promptField${index}`,
            title:
              parameter.label.length > 0
                ? parameter.label
                : commonText.countLine({
                    resource: resourcesText.promptField(),
                    count: index,
                  }),
            shouldPrompt: true,
          }
        : parameter.type === 'ThisField'
        ? {
            name: 'this',
            title: 'This',
            shouldPrompt: false,
          }
        : parameter.type === 'FormattedResource'
        ? {
            name: `${formatter}${parameter.formatter}`,
            title: parameter.formatter,
            shouldPrompt: true,
          }
        : parameter.value
    );
  return {
    url: augmented
      .map((argument) =>
        typeof argument === 'object' ? `<${argument.name}>` : argument
      )
      .join(''),
    parameters: filterArray(
      augmented.map((argument) =>
        typeof argument === 'object'
          ? { ...argument, isEditable: false }
          : undefined
      )
    ),
  };
}
