import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import { schema } from '../DataModel/schema';
import { createSpec, pipe } from './index';
import { createXmlNode, syncers } from './syncers';

export const formattersSpec = f.store(() =>
  createSpec({
    formatters: pipe(
      syncers.xmlChildren('format'),
      syncers.map(syncers.object(formatterSpec()))
    ),
    aggregators: pipe(
      syncers.xmlChild('aggregators'),
      syncers.default(() => createXmlNode('aggregators')),
      syncers.xmlChildren('aggregator'),
      syncers.map(syncers.object(aggregatorSpec()))
    ),
  })
);

export const formatterSpec = f.store(() =>
  createSpec({
    name: pipe(
      syncers.xmlAttribute('name', 'required'),
      syncers.default<LocalizedString>('')
    ),
    title: syncers.xmlAttribute('title', 'empty'),
    tableName: pipe(
      syncers.xmlAttribute('class', 'required'),
      syncers.default(schema.models.CollectionObject.longName),
      syncers.javaClassName
    ),
    isDefault: pipe(
      syncers.xmlAttribute('default', 'empty'),
      syncers.toBoolean
    ),
    definition: pipe(
      syncers.xmlChild('switch'),
      syncers.default(() => createXmlNode('switch'))
    ),
  })
);

export const aggregatorSpec = f.store(() =>
  createSpec({
    name: pipe(
      syncers.xmlAttribute('name', 'required'),
      syncers.default<LocalizedString>('')
    ),
    title: syncers.xmlAttribute('title', 'empty'),
    tableName: pipe(
      syncers.xmlAttribute('class', 'required'),
      syncers.default(schema.models.CollectionObject.longName),
      syncers.javaClassName
    ),
    isDefault: pipe(
      syncers.xmlAttribute('default', 'empty'),
      syncers.toBoolean
    ),
    separator: syncers.xmlAttribute('separator', 'empty', false),
    ending: syncers.xmlAttribute('ending', 'empty', false),
    limit: pipe(
      syncers.xmlAttribute('count', 'empty', false),
      syncers.toDecimal
    ),
    formatterName: syncers.xmlAttribute('format', 'required'),
    sortFieldNames: syncers.xmlAttribute('orderFieldName', 'empty'),
  })
);
