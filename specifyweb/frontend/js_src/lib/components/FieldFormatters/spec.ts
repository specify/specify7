import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import type { LiteralField } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTable } from '../DataModel/tables';
import type { SpecToJson } from '../Syncer';
import { pipe, syncer } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import { createXmlSpec } from '../Syncer/xmlUtils';
import { fieldFormatterTypeMapper } from '.';

export const fieldFormattersSpec = f.store(() =>
  createXmlSpec({
    fieldFormatters: pipe(
      syncers.xmlChildren('format'),
      syncers.map(
        pipe(
          syncers.object(formatterSpec()),
          syncer(
            ({ javaClass, rawAutoNumber, ...formatter }) => ({
              ...formatter,
              table: getTable(javaClass ?? ''),
              raw: {
                javaClass,
                legacyAutoNumber: rawAutoNumber,
              },
            }),
            ({
              table,
              raw: { javaClass, legacyAutoNumber },
              ...formatter
            }) => ({
              ...formatter,
              // "javaClass" is not always a database table
              javaClass:
                localized(table?.longName) ??
                (getTable(javaClass ?? '') === undefined
                  ? javaClass
                  : undefined),
              rawAutoNumber: formatter.parts.some(isAutoNumbering)
                ? legacyAutoNumber ??
                  inferLegacyAutoNumber(table, formatter.parts)
                : undefined,
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

/**
 * Specify 6 hardcoded special autonumbering behavior for a few tables.
 * Accession table has special auto numbering, and collection object has
 * two. Doing a best effort match of intended semantics for backwards
 * compatibility.
 */
function inferLegacyAutoNumber(
  table: SpecifyTable | undefined,
  fields: RA<{
    readonly type: keyof typeof fieldFormatterTypeMapper | undefined;
  }>
): string {
  if (table?.name === 'Accession')
    return 'edu.ku.brc.specify.dbsupport.AccessionAutoNumberAlphaNum';
  else if (table?.name === 'CollectionObject') {
    const isNumericOnly = fields.every((field) => field.type === 'numeric');
    return isNumericOnly
      ? 'edu.ku.brc.specify.dbsupport.CollectionAutoNumber'
      : 'edu.ku.brc.specify.dbsupport.CollectionAutoNumberAlphaNum';
  } else return 'edu.ku.brc.af.core.db.AutoNumberGeneric';
}

const isAutoNumbering = (part: {
  readonly autoIncrement: boolean;
  readonly byYear: boolean;
}): boolean => part.autoIncrement || part.byYear;

export type FieldFormatter = SpecToJson<
  ReturnType<typeof fieldFormattersSpec>
>['fieldFormatters'][number];

export type FieldFormatterPart = FieldFormatter['parts'][number];

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
    rawField: syncers.xmlAttribute('fieldName', 'skip'),
    isDefault: pipe(
      syncers.xmlAttribute('default', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    // Used only in special meta-formatters - we don't display these in the UI
    legacyType: syncers.xmlAttribute('type', 'skip'),
    legacyPartialDate: syncers.xmlAttribute('partialDate', 'skip'),
    rawAutoNumber: pipe(
      syncers.xmlChild('autonumber', 'optional'),
      syncers.maybe(syncers.xmlContent)
    ),
    external: pipe(
      syncers.xmlChild('external', 'optional'),
      syncers.maybe(syncers.xmlContent)
    ),
    parts: pipe(
      syncers.xmlChildren('field'),
      syncers.map(
        pipe(
          syncers.object(partSpec()),
          syncer(normalizeFieldFormatterPart, (part) => ({
            ...part,
            placeholder:
              part.type === 'regex'
                ? localized(normalizeRegexString(part.placeholder))
                : part.placeholder,
          }))
        )
      )
    ),
  })
);

export function normalizeFieldFormatterPart(
  part: SpecToJson<ReturnType<typeof partSpec>>
): SpecToJson<ReturnType<typeof partSpec>> {
  const placeholder =
    part.type === 'regex'
      ? localized(trimRegexString(part.placeholder))
      : part.type === 'year'
      ? fieldFormatterTypeMapper.year.placeholder
      : part.type === 'numeric'
      ? fieldFormatterTypeMapper.numeric.buildPlaceholder(part.size)
      : part.placeholder;
  const size = fieldFormatterTypesWithForcedSize.has(part.type as 'constant')
    ? placeholder.length
    : part.size;
  return { ...part, placeholder, size };
}

export const fieldFormatterTypesWithForcedSize = new Set([
  'constant',
  'separator',
  'year',
] as const);

/**
 * Specify 6 expects the regex pattern to start with "/^" and end with "$/"
 * because it parses each field part individually.
 * In Specify 7, we construct a combined regex that parts all field parts at
 * once.
 * Thus we do not want the "^" and "$" to be part of the pattern as far as
 * Specify 7 front-end is concerned, but we want it to be part of the pattern
 * in the .xml to work with Specify 6.
 */
function trimRegexString(regexString: string): string {
  let pattern = regexString;
  if (pattern.startsWith('/')) pattern = pattern.slice(1);
  if (pattern.startsWith('^')) pattern = pattern.slice(1);
  if (pattern.endsWith('/')) pattern = pattern.slice(0, -1);
  if (pattern.endsWith('$')) pattern = pattern.slice(0, -1);
  if (pattern.startsWith('(') && pattern.endsWith(')'))
    pattern = pattern.slice(1, -1);
  return pattern;
}
function normalizeRegexString(regexString: string): string {
  let pattern: string = trimRegexString(regexString);
  if (pattern.includes('|')) pattern = `(${pattern})`;
  return `/^${pattern}$/`;
}

const partSpec = f.store(() =>
  createXmlSpec({
    type: pipe(
      syncers.xmlAttribute('type', 'required'),
      syncers.fallback(localized('alphanumeric')),
      syncers.enum(Object.keys(fieldFormatterTypeMapper))
    ),
    size: pipe(
      syncers.xmlAttribute('size', 'skip'),
      syncers.maybe(syncers.toDecimal)
    ),
    /*
     * For most parts, this is a human-friendly placeholder like ### or ABC.
     * For regex parts, this contains the actual regular expression
     */
    placeholder: pipe(
      syncers.xmlAttribute('value', 'skip', false),
      syncers.default(localized(''))
    ),
    /*
     * Since regular expressions are less readable, this part is specifically
     * for providing human-readable description of a regular expression
     */
    regexPlaceholder: syncers.xmlAttribute('pattern', 'skip', false),
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

export const exportsForTests = { trimRegexString, normalizeRegexString };
