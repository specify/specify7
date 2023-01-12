import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import { schema } from '../DataModel/schema';
import { createSpec, pipe, safeSyncer, SpecToJson } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import { createXmlNode } from '../Syncer/xmlUtils';

export const formattersSpec = f.store(() =>
  createSpec({
    formatters: pipe(
      syncers.xmlChildren('format'),
      syncers.map(
        pipe(syncers.maybe(syncers.object(formatterSpec())), formatterSyncer)
      )
    ),
    aggregators: pipe(
      syncers.xmlChild('aggregators'),
      syncers.default<Element>(() => createXmlNode('aggregators')),
      syncers.xmlChildren('aggregator'),
      syncers.map(syncers.maybe(syncers.object(aggregatorSpec())))
    ),
  })
);

const formatterSyncer = safeSyncer<
  SpecToJson<ReturnType<typeof formattersSpec>>,
  SpecToJson<ReturnType<typeof formattersSpec>>
>(
  (formatter) => {
    return formatter;
  },
  (formatter, oldValue) => {
    // FIXME: return transformed formatter
    return oldValue;
  }
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
      syncers.default<Element>(() => createXmlNode('switch')),
      syncers.object(switchSpec())
    ),
  })
);

const switchSpec = f.store(() =>
  createSpec({
    isSingle: pipe(syncers.xmlAttribute('default', 'skip'), syncers.toBoolean),
    // FIXME: parse field names
    switchFieldName: syncers.xmlAttribute('field', 'skip'),
    external: syncers.xmlChild('external'),
    fields: pipe(
      syncers.xmlChildren('fields'),
      syncers.map(syncers.maybe(syncers.object(fieldsSpec())))
    ),
  })
);

const fieldsSpec = f.store(() =>
  createSpec({
    value: syncers.xmlAttribute('value', 'skip'),
    fields: pipe(
      syncers.xmlChildren('fields'),
      syncers.map(syncers.maybe(syncers.object(fieldSpec())))
    ),
  })
);

const fieldSpec = f.store(() =>
  createSpec({
    separator: syncers.xmlAttribute('sep', 'skip'),
    // FIXME: Only allow this on relationships
    formatter: syncers.xmlAttribute('formatter', 'skip'),
    // FIXME: Only allow this on fields
    fieldFormatter: syncers.xmlAttribute('uiFieldFormatter', 'skip'),
    // FIXME: parse field names
    name: syncers.xmlContent,
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
    // FIXME: parse field names
    sortFieldNames: syncers.xmlAttribute('orderFieldName', 'empty'),
  })
);
