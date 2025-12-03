import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray, localized } from '../../utils/types';
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
      syncers.default(localized(''))
    ),
    table: pipe(
      syncers.xmlChild('tableName', 'optional'),
      syncers.maybe(syncers.xmlContent),
      syncers.maybe(syncers.tableName)
    ),
    description: pipe(
      syncers.xmlChild('desc', 'optional'),
      syncers.maybe(syncers.xmlContent),
      syncers.default(localized(''))
    ),
    url: pipe(
      syncers.xmlChild('baseURLStr'),
      syncers.maybe(syncers.xmlContent)
    ),
    parameters: pipe(
      syncers.xmlChild('args'),
      syncers.fallback(createSimpleXmlNode),
      syncers.xmlChildren('weblinkdefarg'),
      syncers.map(syncers.object(argumentSpec()))
    ),
    usages: pipe(
      syncers.xmlChild('usedByList'),
      syncers.fallback(createSimpleXmlNode),
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
      syncers.default(localized(''))
    ),
    title: pipe(
      syncers.xmlChild('title', 'optional'),
      syncers.maybe(syncers.xmlContent),
      syncers.default(localized(''))
    ),
    /**
     * Specify 6 only. It was temporary implemented in Specify 7, but was removed
     * in https://github.com/specify/specify7/issues/4525
     */
    legacyShouldPrompt: pipe(
      syncers.xmlChild('prompt', 'optional'),
      syncers.maybe(syncers.xmlContent),
      syncers.maybe(syncers.toBoolean)
    ),
    legacyIsEditable: pipe(
      syncers.xmlChild('isEditable', 'optional'),
      syncers.maybe(syncers.xmlContent),
      syncers.maybe(syncers.toBoolean),
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
      syncers.maybe(syncers.tableName)
    ),
    fieldName: pipe(
      syncers.xmlChild('fieldName'),
      syncers.maybe(syncers.xmlContent)
    ),
  })
);

type ParsedWebLink =
  | State<'Field', { readonly field: RA<LiteralField | Relationship> }>
  | State<'FormattedResource', { readonly formatter: LocalizedString }>
  | State<'ThisField'>
  | State<'UrlPart', { readonly value: LocalizedString }>;

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
            value: localized(part),
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
  return { type: 'UrlPart', value: localized('') };
}

function reconstructWeblink(
  parts: RA<ParsedWebLink>
): Pick<RawWebLink, 'parameters' | 'url'> {
  const augmented = parts
    .filter((part) => part.type !== 'Field' || part.field.length > 0)
    .map((parameter) =>
      parameter.type === 'Field'
        ? {
            name: parameter.field.map(({ name }) => name).join('.'),
            title: parameter.field.map(({ label }) => label).join(' > '),
          }
        : parameter.type === 'ThisField'
          ? {
              name: 'this',
              title: 'This',
            }
          : parameter.type === 'FormattedResource'
            ? {
                name: `${formatter}${parameter.formatter}`,
                title: parameter.formatter,
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
          ? {
              ...argument,
              name: localized(argument.name),
              title: localized(argument.title),
              legacyIsEditable: false,
              legacyShouldPrompt: undefined,
            }
          : undefined
      )
    ),
  };
}
