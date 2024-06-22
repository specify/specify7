import { f } from '../../utils/functools';
import { localized } from '../../utils/types';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { SpecToJson } from '../Syncer';
import { pipe, syncer } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import type { SimpleXmlNode } from '../Syncer/xmlToJson';
import { createSimpleXmlNode } from '../Syncer/xmlToJson';
import { createXmlSpec } from '../Syncer/xmlUtils';

export const formattersSpec = f.store(() =>
  createXmlSpec({
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
                fields: definition.fields
                  .filter((fieldGroup) => fieldGroup.fields.length > 0)
                  .map((fieldGroup) => ({
                    ...fieldGroup,
                    fields: fieldGroup.fields.filter(
                      (field) => field.field !== undefined
                    ),
                  })),
                isSingle: definition.fields.length <= 1,
              },
            })
          )
        )
      )
    ),
    aggregators: pipe(
      syncers.xmlChild('aggregators'),
      syncers.fallback<SimpleXmlNode>(createSimpleXmlNode),
      syncers.xmlChildren('aggregator'),
      syncers.map(
        pipe(
          syncers.object(aggregatorSpec()),
          syncers.change(
            'sortField',
            ({ table, sortField }) =>
              syncers.field(table?.name).serializer(sortField),
            ({ table, sortField }) =>
              syncers.field(table?.name).deserializer(sortField)
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

// eslint-disable-next-line capitalized-comments
/* jscpd:ignore-start */
const formatterSpec = f.store(() =>
  createXmlSpec({
    name: pipe(
      syncers.xmlAttribute('name', 'required'),
      syncers.default<string>('')
    ),
    title: syncers.xmlAttribute('title', 'empty'),
    table: pipe(
      syncers.xmlAttribute('class', 'required'),
      syncers.maybe(syncers.javaClassName())
    ),
    isDefault: pipe(
      syncers.xmlAttribute('default', 'empty'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    definition: pipe(
      syncers.xmlChild('switch'),
      syncers.fallback<SimpleXmlNode>(createSimpleXmlNode),
      syncers.captureLogContext()
    ),
  })
);
// eslint-disable-next-line capitalized-comments
/* jscpd:ignore-end */

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const switchSpec = ({ table }: SpecToJson<ReturnType<typeof formatterSpec>>) =>
  createXmlSpec({
    isSingle: pipe(
      syncers.xmlAttribute('single', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
    conditionField: pipe(
      syncers.xmlAttribute('field', 'skip'),
      syncers.field(table?.name)
    ),
    external: syncers.xmlChild('external', 'optional'),
    fields: pipe(
      syncers.xmlChildren('fields'),
      syncers.map(syncers.object(fieldsSpec(table)))
    ),
  });

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const fieldsSpec = (table: SpecifyTable | undefined) =>
  createXmlSpec({
    value: syncers.xmlAttribute('value', 'skip'),
    fields: pipe(
      syncers.xmlChildren('field'),
      syncers.map(syncers.object(fieldSpec(table)))
    ),
  });

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const fieldSpec = (table: SpecifyTable | undefined) =>
  createXmlSpec({
    separator: pipe(
      syncers.xmlAttribute('sep', 'skip', false),
      syncers.default(localized(''))
    ),
    aggregator: syncers.xmlAttribute('aggregator', 'skip'),
    formatter: syncers.xmlAttribute('formatter', 'skip'),
    fieldFormatter: syncers.xmlAttribute('uiFieldFormatter', 'skip'),
    field: pipe(syncers.xmlContent, syncers.field(table?.name)),
  });

const aggregatorSpec = f.store(() =>
  createXmlSpec({
    name: pipe(
      syncers.xmlAttribute('name', 'required'),
      syncers.default<string>('')
    ),
    title: syncers.xmlAttribute('title', 'empty'),
    table: pipe(
      syncers.xmlAttribute('class', 'required'),
      syncers.maybe(syncers.javaClassName())
    ),
    isDefault: pipe(
      syncers.xmlAttribute('default', 'empty'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    separator: pipe(
      syncers.xmlAttribute('separator', 'empty', false),
      syncers.fallback(localized('; '))
    ),
    suffix: syncers.xmlAttribute('ending', 'empty', false),
    limit: pipe(
      syncers.xmlAttribute('count', 'skip'),
      syncers.maybe(syncers.toDecimal)
    ),
    formatter: syncers.xmlAttribute('format', 'empty'),
    sortField: syncers.xmlAttribute('orderFieldName', 'skip'),
  })
);
