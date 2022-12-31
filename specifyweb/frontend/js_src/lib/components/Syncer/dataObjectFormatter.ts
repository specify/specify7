import { f } from '../../utils/functools';
import { schema } from '../DataModel/schema';
import { createSpec, pipe } from './index';
import { syncers } from './syncers';
import { LocalizedString } from 'typesafe-i18n';

export const formattersSpec = f.store(() => {
  return createSpec({
    formatters: pipe(
      syncers.xmlChildren('format'),
      syncers.array(formatterSpec())
    ),
    aggregators: pipe(
      syncers.xmlChild('aggregators'),
      syncers.default(() => document.createElement('aggregators') as Element),
      syncers.xmlChildren('aggregator'),
      syncers.array(aggregatorSpec())
    ),
  });
});

export const formatterSpec = f.store(() =>
  createSpec({
    name: pipe(
      syncers.xmlAttribute('name', true),
      syncers.default<LocalizedString>('')
    ),
    title: pipe(
      syncers.xmlAttribute('title', false),
      syncers.default<LocalizedString>('')
    ),
    tableName: pipe(
      syncers.xmlAttribute('class', true),
      syncers.default(schema.models.CollectionObject.longName),
      syncers.javaClassName
    ),
    isDefault: pipe(
      syncers.xmlAttribute('default', false),
      syncers.default<LocalizedString>('false'),
      syncers.toBoolean
    ),
    definition: pipe(
      syncers.xmlChild('switch'),
      syncers.default(() => document.createElement('switch') as Element)
    ),
  })
);

export const aggregatorSpec = f.store(() =>
  createSpec({
    name: pipe(
      syncers.xmlAttribute('name', true),
      syncers.default<LocalizedString>('')
    ),
    title: pipe(
      syncers.xmlAttribute('title', false),
      syncers.default<LocalizedString>('')
    ),
    tableName: pipe(
      syncers.xmlAttribute('class', true),
      syncers.default(schema.models.CollectionObject.longName),
      syncers.javaClassName
    ),
    isDefault: pipe(
      syncers.xmlAttribute('default', false),
      syncers.default<LocalizedString>('false'),
      syncers.toBoolean
    ),
    separator: pipe(
      syncers.xmlAttribute('separator', false, false),
      syncers.default<LocalizedString>('; ')
    ),
    ending: pipe(
      syncers.xmlAttribute('ending', false, false),
      syncers.default<LocalizedString>('')
    ),
    limit: pipe(
      syncers.xmlAttribute('count', false, false),
      syncers.default<LocalizedString>(''),
      syncers.toDecimal
    ),
    formatterName: syncers.xmlAttribute('format', true),
    sortFieldNames: syncers.xmlAttribute('orderFieldName', false),
  })
);
