import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import { getTable } from '../DataModel/tables';
import type { LiteralField } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
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
                table?.longName ??
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
              rawField: field?.name,
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
      syncers.default<LocalizedString>(''),
      syncers.toBoolean
    ),
    name: pipe(
      syncers.xmlAttribute('name', 'required'),
      syncers.default<LocalizedString>('')
    ),
    title: syncers.xmlAttribute('title', 'empty'),
    // Some special formatters don't have a class name
    javaClass: syncers.xmlAttribute('class', 'skip'),
    // BUG: enforce no relationship fields
    rawField: syncers.xmlAttribute('fieldName', 'skip'),
    isDefault: pipe(
      syncers.xmlAttribute('default', 'skip'),
      syncers.default<LocalizedString>(''),
      syncers.toBoolean
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
      syncers.default<LocalizedString>('alphanumeric'),
      // TEST: check if sp6 defines any other types not present in this list
      syncers.enum(Object.keys(formatterTypeMapper))
    ),
    size: pipe(
      syncers.xmlAttribute('size', 'skip'),
      syncers.default<LocalizedString>(''),
      syncers.toDecimal,
      syncers.default<number>(1)
    ),
    value: pipe(
      syncers.xmlAttribute('value', 'skip'),
      syncers.default<LocalizedString>(' ')
    ),
    byYear: pipe(
      syncers.xmlAttribute('byYear', 'skip'),
      syncers.default<LocalizedString>(''),
      syncers.toBoolean
    ),
    autoIncrement: pipe(
      syncers.xmlAttribute('inc', 'skip'),
      syncers.default<LocalizedString>(''),
      syncers.toBoolean
    ),
    pattern: syncers.xmlAttribute('pattern', 'skip'),
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
