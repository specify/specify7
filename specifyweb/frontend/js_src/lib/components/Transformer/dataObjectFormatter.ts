import { f } from '../../utils/functools';
import { schema } from '../DataModel/schema';
import { createSpec, pipe } from './index';
import { transformers } from './transformers';
import { LocalizedString } from 'typesafe-i18n';

export const formattersSpec = f.store(() => {
  return createSpec({
    formatters: pipe(
      transformers.xmlChildren('formatter'),
      transformers.array(formatterSpec())
    ),
    aggregators: pipe(
      transformers.xmlChild('aggregators'),
      transformers.default(
        () => document.createElement('aggregators') as Element
      ),
      transformers.xmlChildren('aggregator'),
      transformers.array(aggregatorSpec())
    ),
  });
});

export const formatterSpec = f.store(() =>
  createSpec({
    name: pipe(
      transformers.xmlAttribute('name', true),
      transformers.default<LocalizedString>('')
    ),
    title: pipe(
      transformers.xmlAttribute('title', false),
      transformers.default<LocalizedString>('')
    ),
    tableName: pipe(
      transformers.xmlAttribute('class', true),
      transformers.default(schema.models.CollectionObject.longName),
      transformers.javaClassName
    ),
    isDefault: pipe(
      transformers.xmlAttribute('default', false),
      transformers.default<LocalizedString>('false'),
      transformers.toBoolean
    ),
    definition: pipe(
      transformers.xmlChild('switch'),
      transformers.default(() => document.createElement('switch') as Element)
    ),
  })
);

export const aggregatorSpec = f.store(() =>
  createSpec({
    name: pipe(
      transformers.xmlAttribute('name', true),
      transformers.default<LocalizedString>('')
    ),
    title: pipe(
      transformers.xmlAttribute('title', false),
      transformers.default<LocalizedString>('')
    ),
    tableName: pipe(
      transformers.xmlAttribute('class', true),
      transformers.default(schema.models.CollectionObject.longName),
      transformers.javaClassName
    ),
    isDefault: pipe(
      transformers.xmlAttribute('default', false),
      transformers.default<LocalizedString>('false'),
      transformers.toBoolean
    ),
    separator: pipe(
      transformers.xmlAttribute('separator', true, false),
      transformers.default<LocalizedString>('; ')
    ),
    ending: pipe(
      transformers.xmlAttribute('ending', true, false),
      transformers.default<LocalizedString>('')
    ),
    limit: pipe(
      transformers.xmlAttribute('count', true, false),
      transformers.default<LocalizedString>(''),
      transformers.toDecimal
    ),
    formatterName: transformers.xmlAttribute('format', true),
    sortFieldNames: transformers.xmlAttribute('orderFieldName', true),
  })
);
