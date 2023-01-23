import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import { pipe, SpecToJson } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import { createSimpleXmlNode } from '../Syncer/xmlToJson';
import { createXmlSpec } from '../Syncer/xmlUtils';

export const webLinksSpec = f.store(() =>
  createXmlSpec({
    webLinks: pipe(
      syncers.xmlChildren('weblinkdef'),
      syncers.map(syncers.object(webLinkSpec()))
    ),
  })
);

export type WebLink = SpecToJson<
  ReturnType<typeof webLinksSpec>
>['webLinks'][number];

const webLinkSpec = f.store(() =>
  createXmlSpec({
    name: pipe(
      syncers.xmlChild('name', 'required'),
      syncers.maybe(syncers.xmlContent),
      syncers.default<LocalizedString>('')
    ),
    table: pipe(
      syncers.xmlChild('tableName', 'required'),
      syncers.maybe(syncers.xmlContent),
      syncers.maybe(syncers.tableName)
    ),
    description: pipe(
      syncers.xmlChild('desc', 'required'),
      syncers.maybe(syncers.xmlContent),
      syncers.default<LocalizedString>('')
    ),
    url: pipe(
      syncers.xmlChild('baseURLStr', 'required'),
      syncers.maybe(syncers.xmlContent)
    ),
    parameters: pipe(
      syncers.xmlChild('args', 'required'),
      syncers.default(() => createSimpleXmlNode('args')),
      syncers.xmlChildren('weblinkdefarg'),
      syncers.map(syncers.object(argumentSpec()))
    ),
    usages: pipe(
      syncers.xmlChild('usedByList', 'required'),
      syncers.default(() => createSimpleXmlNode('usedByList')),
      syncers.xmlChildren('usedby'),
      syncers.map(syncers.object(usedBySpec()))
    ),
  })
);

const argumentSpec = f.store(() =>
  createXmlSpec({
    name: pipe(
      syncers.xmlChild('name', 'required'),
      syncers.maybe(syncers.xmlContent),
      syncers.default<LocalizedString>('')
    ),
    title: pipe(
      syncers.xmlChild('name', 'required'),
      syncers.maybe(syncers.xmlContent),
      syncers.default<LocalizedString>('')
    ),
    shouldPrompt: pipe(
      syncers.xmlChild('prompt', 'required'),
      syncers.maybe(syncers.xmlContent),
      syncers.default<LocalizedString>(''),
      syncers.toBoolean
    ),
  })
);

const usedBySpec = f.store(() =>
  createXmlSpec({
    table: pipe(
      syncers.xmlChild('name', 'required'),
      syncers.maybe(syncers.xmlContent),
      syncers.default<LocalizedString>(''),
      syncers.tableName
    ),
    fieldName: pipe(
      syncers.xmlChild('title', 'required'),
      syncers.maybe(syncers.xmlContent)
    ),
  })
);
