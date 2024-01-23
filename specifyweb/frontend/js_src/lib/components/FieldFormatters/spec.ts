import { f } from '../../utils/functools';
import { localized } from '../../utils/types';
import type { LiteralField } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTable } from '../DataModel/tables';
import type { SpecToJson } from '../Syncer';
import { pipe, syncer } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import { createXmlSpec } from '../Syncer/xmlUtils';
import { formatterTypeMapper } from './index';

export const fieldFormattersSpec = f.store(() =>
  createXmlSpec({
    formatters: pipe(
      syncers.xmlChildren('format'),
      syncers.map(
        pipe(
          syncers.object(formatterSpec()),
          syncer(
            ({ javaClass, ...formatter }) => ({
              ...formatter,
              table: getTable(javaClass ?? ''),
              raw: {
                javaClass,
              },
            }),
            ({ table, raw: { javaClass }, ...formatter }) => ({
              ...formatter,
              // "javaClass" is not always a database table
              javaClass:
                localized(table?.longName) ??
                (getTable(javaClass ?? '') === undefined
                  ? javaClass
                  : undefined),
            })
          ),
          syncer(
            ({ rawField, ...formatter }) => ({
              ...formatter,
              field: parseField(formatter.table, rawField),
            }),
            ({ field, ...formatter }) => ({
              ...formatter,
              rawField: localized(field?.name),
            })
          )
        )
      )
    ),
  })
);

export type FieldFormatter = SpecToJson<
  ReturnType<typeof fieldFormattersSpec>
>['formatters'][number];

const formatterSpec = f.store(() =>
  createXmlSpec({
    isSystem: pipe(
      syncers.xmlAttribute('system', 'required'),
      syncers.maybe(syncers.toBoolean),
      syncers.fallback(false)
    ),
    name: pipe(
      syncers.xmlAttribute('name', 'required'),
      syncers.default(localized(''))
    ),
    title: syncers.xmlAttribute('title', 'empty'),
    // Some special formatters don't have a class name
    javaClass: syncers.xmlAttribute('class', 'skip'),
    // BUG: enforce no relationship fields
    rawField: syncers.xmlAttribute('fieldName', 'skip'),
    isDefault: pipe(
      syncers.xmlAttribute('default', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    autoNumber: pipe(
      syncers.xmlChild('autonumber', 'optional'),
      syncers.maybe(syncers.xmlContent)
    ),
    external: pipe(
      syncers.xmlChild('external', 'optional'),
      syncers.maybe(syncers.xmlContent)
    ),
    fields: pipe(
      syncers.xmlChildren('field'),
      syncers.map(syncers.object(fieldSpec()))
    ),
  })
);

const fieldSpec = f.store(() =>
  createXmlSpec({
    type: pipe(
      syncers.xmlAttribute('type', 'required'),
      syncers.fallback(localized('alphanumeric')),
      // TEST: check if sp6 defines any other types not present in this list
      syncers.enum(Object.keys(formatterTypeMapper))
    ),
    size: pipe(
      syncers.xmlAttribute('size', 'skip'),
      syncers.maybe(syncers.toDecimal),
      syncers.default<number>(1)
    ),
    value: pipe(
      syncers.xmlAttribute('value', 'skip', false),
      syncers.default(localized(' '))
    ),
    byYear: pipe(
      syncers.xmlAttribute('byYear', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    autoIncrement: pipe(
      syncers.xmlAttribute('inc', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    pattern: syncers.xmlAttribute('pattern', 'skip', false),
  })
);

function parseField(
  table: SpecifyTable | undefined,
  name: string | undefined
): LiteralField | undefined {
  if (name?.includes('.') === true) {
    console.error('Only direct fields are allowed');
    return undefined;
  }
  const field = table?.getField(name ?? '');
  if (field?.isRelationship === true) {
    console.error('Relationship fields are not allowed');
    return undefined;
  } else return field;
}
