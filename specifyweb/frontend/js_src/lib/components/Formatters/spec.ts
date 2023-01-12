import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import type { Tables } from '../DataModel/types';
import type { SpecToJson } from '../Syncer';
import { createSpec, pipe, syncer } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import { createXmlNode } from '../Syncer/xmlUtils';

export const formattersSpec = f.store(() =>
  createSpec({
    formatters: pipe(
      syncers.xmlChildren('format'),
      syncers.map(
        pipe(
          syncers.object(formatterSpec()),
          syncers.dependent('definition', switchSpec),
          syncer(
            (formatter) => formatter,
            ({ definition, ...formatter }) => ({
              ...formatter,
              definition: {
                ...definition,
                isSingle: definition.fields.length <= 1,
              },
            })
          )
        )
      )
    ),
    aggregators: pipe(
      syncers.xmlChild('aggregators'),
      syncers.default<Element>(() => createXmlNode('aggregators')),
      syncers.xmlChildren('aggregator'),
      syncers.map(
        pipe(
          syncers.object(aggregatorSpec()),
          syncer(
            ({ tableName, sortField, ...rest }) => ({
              ...rest,
              tableName,
              sortField: syncers.field(tableName).serializer(sortField),
            }),
            ({ tableName, sortField, ...rest }, old) => ({
              ...rest,
              tableName,
              sortField: syncers
                .field(tableName)
                .deserializer(sortField, old?.sortField),
            })
          )
        )
      )
    ),
  })
);

export type Formatter = SpecToJson<
  ReturnType<typeof formattersSpec>
>['formatters'][number];
export type Aggregator = SpecToJson<
  ReturnType<typeof formattersSpec>
>['aggregators'][number];

const formatterSpec = f.store(() =>
  createSpec({
    name: pipe(
      syncers.xmlAttribute('name', 'required'),
      syncers.default<LocalizedString>('')
    ),
    title: syncers.xmlAttribute('title', 'empty'),
    tableName: pipe(
      syncers.xmlAttribute('class', 'required'),
      syncers.maybe(syncers.javaClassName)
    ),
    // FIXME: enforce single default in the UI
    isDefault: pipe(
      syncers.xmlAttribute('default', 'empty'),
      syncers.default<LocalizedString>(''),
      syncers.toBoolean
    ),
    definition: pipe(
      syncers.xmlChild('switch'),
      syncers.default<Element>(() => createXmlNode('switch'))
    ),
  })
);

const switchSpec = ({
  tableName,
}: SpecToJson<ReturnType<typeof formatterSpec>>) =>
  createSpec({
    isSingle: pipe(
      syncers.xmlAttribute('default', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
    conditionField: pipe(
      syncers.xmlAttribute('field', 'skip'),
      syncers.field(tableName),
      syncer((fields) => {
        const field = fields?.at(-1);
        // FIXME: add validation for no -to-manys in the middle (and in forms too)
        if (field?.isRelationship === true && field.isDependent()) {
          console.error('Dependent relationship may not be used as condition');
          return undefined;
        } else return fields;
      }, f.id)
    ),
    // FIXME: hide formatters that contain this
    external: syncers.xmlChild('external'),
    fields: pipe(
      syncers.xmlChildren('fields'),
      syncers.map(syncers.object(fieldsSpec(tableName)))
    ),
  });

const fieldsSpec = (tableName: keyof Tables | undefined) =>
  createSpec({
    value: syncers.xmlAttribute('value', 'skip'),
    fields: pipe(
      syncers.xmlChildren('fields'),
      syncers.map(
        pipe(
          syncers.object(fieldSpec(tableName)),
          syncers.change(
            'fieldFormatter',
            ({ field, fieldFormatter }) => {
              if (
                field?.at(-1)?.isRelationship === true &&
                typeof fieldFormatter === 'string'
              ) {
                console.warn(
                  'Field formatter is ignored for relationship fields'
                );
                return undefined;
              }
              return fieldFormatter;
            },
            ({ fieldFormatter }) => fieldFormatter
          ),
          syncers.change(
            'formatter',
            ({ field, formatter }) => {
              if (
                field?.at(-1)?.isRelationship === false &&
                typeof formatter === 'string'
              ) {
                console.warn(
                  'Record formatter is ignored for non-relationship fields'
                );
                return undefined;
              }
              return formatter;
            },
            ({ formatter }) => formatter
          )
        )
      )
    ),
  });

const fieldSpec = (tableName: keyof Tables | undefined) =>
  createSpec({
    separator: pipe(
      syncers.xmlAttribute('sep', 'skip'),
      syncers.default<LocalizedString>('')
    ),
    aggregator: syncers.xmlAttribute('aggregator', 'skip'),
    formatter: syncers.xmlAttribute('formatter', 'skip'),
    fieldFormatter: syncers.xmlAttribute('uiFieldFormatter', 'skip'),
    field: pipe(syncers.xmlContent, syncers.field(tableName)),
  });

export const aggregatorSpec = f.store(() =>
  createSpec({
    name: pipe(
      syncers.xmlAttribute('name', 'required'),
      syncers.default<LocalizedString>('')
    ),
    title: syncers.xmlAttribute('title', 'empty'),
    tableName: pipe(
      syncers.xmlAttribute('class', 'required'),
      syncers.maybe(syncers.javaClassName)
    ),
    isDefault: pipe(
      syncers.xmlAttribute('default', 'empty'),
      syncers.default<LocalizedString>(''),
      syncers.toBoolean
    ),
    separator: pipe(
      syncers.xmlAttribute('separator', 'empty', false),
      syncers.default<LocalizedString>('; ')
    ),
    ending: syncers.xmlAttribute('ending', 'empty', false),
    limit: pipe(
      syncers.xmlAttribute('count', 'empty', false),
      syncers.default<LocalizedString>(''),
      syncers.toDecimal
    ),
    formatterName: syncers.xmlAttribute('format', 'empty'),
    sortField: syncers.xmlAttribute('orderFieldName', 'empty'),
  })
);
