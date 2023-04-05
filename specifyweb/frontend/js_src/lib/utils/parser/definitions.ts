/**
 * A potentially overloaded file that is responsible for validating data,
 * parsing it and formatting it
 */

import type {
  JavaType,
  LiteralField,
  Relationship,
  RelationshipType,
} from '../../components/DataModel/specifyField';
import { error } from '../../components/Errors/assert';
import type { UiFormatter } from '../../components/Forms/uiFormatters';
import { monthsPickList } from '../../components/PickLists/definitions';
import { userPreferences } from '../../components/Preferences/userPreferences';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { queryText } from '../../localization/query';
import { dayjs } from '../dayJs';
import { f } from '../functools';
import { parseRelativeDate } from '../relativeDate';
import type { IR, RA, RR } from '../types';
import { filterArray } from '../types';
import { databaseDateFormat } from './dateConfig';
import { fullDateFormat } from './dateFormat';

/** Makes sure a wrapped function would receive a string value */
export const stringGuard =
  (formatter: (value: string) => unknown) => (value: unknown) =>
    typeof value === 'string'
      ? formatter(value)
      : error('Value is not a string');

export const formatter: IR<(value: unknown) => unknown> = {
  trim: stringGuard(f.trim),
  toLowerCase: stringGuard((value) => value.toLowerCase()),
  toUpperCase: stringGuard((value) => value.toUpperCase()),
  int: stringGuard(Number.parseInt),
  float: stringGuard(Number.parseFloat),
};

export const validators: IR<(value: unknown) => string | undefined> = {
  number: (value) =>
    typeof value === 'number' &&
    !Number.isNaN(value) &&
    (!Number.isInteger(value) || Number.isSafeInteger(value))
      ? undefined
      : formsText.inputTypeNumber(),
} as const;

export type Parser = Partial<{
  readonly type: 'checkbox' | 'date' | 'number' | 'text';
  readonly minLength: number;
  readonly maxLength: number;
  // Number, or a string date in yyyy-mm-dd format
  readonly min: number | string;
  // Number, or a string date in yyyy-mm-dd format
  readonly max: number | string;
  readonly step: number;
  readonly placeholder: string;
  readonly pattern: RegExp;
  // Browsers use this as an error message when value does not match the pattern
  readonly title: string;
  /*
   * Format a value before validating it. Formatters are applied in the order
   * they are defined
   */
  readonly formatters: RA<typeof formatter[string]>;
  // Validate the value
  readonly validators: RA<typeof validators[string]>;
  // Format the value after formatting it
  readonly parser: (value: unknown) => unknown;
  // Format the value for use in read only contexts
  readonly printFormatter: (value: unknown, parser: Parser) => string;
  readonly required: boolean;
  // Default value
  readonly value: boolean | number | string;
  // This is different from field.getPickList() for Month partial date
  readonly pickListName: string;
}>;

const numberPrintFormatter = (value: unknown, { step }: Parser): string =>
  typeof value === 'number' && typeof step === 'number' && step > 0
    ? f.round(value, step).toString()
    : (value as number)?.toString() ?? '';

type ExtendedJavaType = JavaType | 'day' | 'month' | 'year';

export const parsers = f.store(
  (): RR<ExtendedJavaType, ExtendedJavaType | Parser> => ({
    'java.lang.Boolean': {
      type: 'checkbox',
      pattern: /true|false|yes|no|nan|null|undefined/iu,
      title: formsText.illegalBool(),
      formatters: [formatter.toLowerCase],
      parser: stringGuard((value) => ['yes', 'true'].includes(value)),
      printFormatter: (value) =>
        value === undefined
          ? ''
          : Boolean(value)
          ? queryText.yes()
          : commonText.no(),
      value: false,
    },

    'java.lang.Byte': {
      type: 'number',
      min: 0,
      max: 255,
      step: 1,
      formatters: [formatter.int],
      validators: [validators.number],
      value: 0,
      printFormatter: numberPrintFormatter,
    },

    'java.lang.Double': {
      type: 'number',
      formatters: [formatter.float],
      validators: [validators.number],
      value: 0,
      printFormatter: numberPrintFormatter,
    },

    'java.lang.Float': 'java.lang.Double',

    'java.lang.Long': {
      type: 'number',
      min: Number.MIN_SAFE_INTEGER,
      max: Number.MAX_SAFE_INTEGER,
      step: 1,
      formatters: [formatter.int],
      validators: [validators.number],
      value: 0,
      printFormatter: numberPrintFormatter,
    },

    'java.lang.Integer': {
      type: 'number',
      min: -(2 ** 31),
      max: 2 ** 31,
      step: 1,
      formatters: [formatter.int],
      validators: [validators.number],
      value: 0,
      printFormatter: numberPrintFormatter,
    },

    'java.lang.Short': {
      type: 'number',
      min: -1 << 15,
      max: 1 << 15,
      step: 1,
      formatters: [formatter.int],
      validators: [validators.number],
      value: 0,
      printFormatter: numberPrintFormatter,
    },

    'java.lang.String': {
      type: 'text',
      maxLength: 2 ** 31 - 1,
      value: '',
    },

    'java.math.BigDecimal': 'java.lang.Double',

    'java.sql.Timestamp': {
      type: 'date',
      minLength: fullDateFormat().length,
      // FEATURE: allow customizing this in global prefs
      max: '9999-12-31',
      formatters: [
        formatter.toLowerCase,
        stringGuard((value) =>
          f.maybe(parseRelativeDate(value), (date) => f.maybe(date, dayjs))
        ),
      ],
      validators: [
        (value): string | undefined =>
          typeof value === 'object' && (value as dayjs.Dayjs).isValid()
            ? undefined
            : formsText.requiredFormat({ format: fullDateFormat() }),
      ],
      title: formsText.requiredFormat({ format: fullDateFormat() }),
      parser: (value) => (value as dayjs.Dayjs)?.format(databaseDateFormat),
      value: dayjs().format(databaseDateFormat),
    },

    'java.util.Calendar': 'java.sql.Timestamp',

    'java.util.Date': 'java.sql.Timestamp',

    year: {
      type: 'number',
      min: 1,
      max: 9999,
      step: 1,
      formatters: [formatter.int],
      validators: [validators.number],
      value: new Date().getFullYear().toString(),
    },

    month: {
      type: 'number',
      min: 1,
      max: 12,
      step: 1,
      formatters: [formatter.int],
      validators: [validators.number],
      // Caution: getMonth is 0-based
      value: (new Date().getMonth() + 1).toString(),
      pickListName: monthsPickList?.().get('name'),
    },

    day: {
      type: 'number',
      min: 1,
      max: 31,
      step: 1,
      formatters: [formatter.int],
      validators: [validators.number],
      value: new Date().getDate().toString(),
    },

    text: {
      type: 'text',
      value: '',
    },
  })
);

type ExtendedField = Partial<Omit<LiteralField | Relationship, 'type'>> & {
  readonly type: ExtendedJavaType | RelationshipType;
  readonly datePart?: 'day' | 'fullDate' | 'month' | 'year';
};

export function parserFromType(fieldType: ExtendedJavaType): Parser {
  let parser = parsers()[fieldType];
  if (typeof parser === 'string') parser = parsers()[parser];
  if (typeof parser !== 'object')
    parser = {
      type: 'text',
      value: '',
    };
  return parser;
}

export function resolveParser(
  field: Partial<LiteralField | Relationship>,
  extras?: Partial<ExtendedField>
): Parser {
  const fullField = { ...field, ...extras };
  let parser = parserFromType(fullField.type as ExtendedJavaType);

  if (field.isRelationship === true) parser = { ...parser, value: undefined };

  if (
    parser.type === 'date' &&
    typeof fullField.datePart === 'string' &&
    fullField.datePart !== 'fullDate'
  )
    parser = parsers()[fullField.datePart] as Parser;

  const formatter = field.getUiFormatter?.();
  return mergeParsers(parser, {
    pickListName: field.getPickList?.(),
    // Don't make checkboxes required
    required: fullField.isRequired === true && parser.type !== 'checkbox',
    maxLength: fullField.length,
    ...(typeof formatter === 'object'
      ? formatterToParser(field, formatter)
      : {}),
  });
}

export function mergeParsers(base: Parser, extra: Parser): Parser {
  const concat = ['formatters', 'validators'] as const;
  const takeMin = ['max', 'step', 'maxLength'] as const;
  const takeMax = ['min', 'minLength'] as const;

  return Object.fromEntries(
    [
      ...Object.entries(base).filter(([_key, value]) => value !== undefined),
      ...Object.entries(extra).filter(([_key, value]) => value !== undefined),
      [
        'required',
        base?.required === true || extra?.required === true ? true : undefined,
      ],
      ...concat
        .map((key) => [key, [...(base[key] ?? []), ...(extra[key] ?? [])]])
        .filter(([_key, value]) => value.length > 0),
      ...takeMin.map((key) => [key, resolveDate(base[key], extra[key], true)]),
      ...takeMax
        .map((key) => [key, resolveDate(base[key], extra[key], false)])
        .filter(([_key, value]) => Number.isFinite(value)),
    ].filter(([_key, value]) => value !== undefined)
  );
}

function resolveDate(
  left: number | string | undefined,
  right: number | string | undefined,
  takeMin: boolean
): number | string | undefined {
  const values = filterArray([left, right]);
  if (typeof values[0] === 'string') {
    if (values.length === 1) return values[0];
    const leftDate = new Date(values[0]);
    const rightDate = new Date(values[1]);
    return leftDate.getTime() < rightDate.getTime() === takeMin
      ? values[0]
      : values[1];
  }
  const callback = takeMin ? f.min : f.max;
  return callback(...(values as RA<number | undefined>));
}

export function formatterToParser(
  field: Partial<LiteralField | Relationship>,
  formatter: UiFormatter
): Parser {
  const regExpString = formatter.parseRegExp();
  const title = formsText.requiredFormat({
    format: formatter.pattern() ?? formatter.valueOrWild(),
  });

  const autoNumberingConfig = userPreferences.get(
    'form',
    'preferences',
    'autoNumbering'
  );
  const modelName = field.model?.name;
  const autoNumberingFields =
    typeof modelName === 'string'
      ? (autoNumberingConfig[modelName] as RA<string>)
      : undefined;
  const canAutoNumber =
    formatter.canAutonumber() &&
    autoNumberingFields?.includes(field.name ?? '') !== false;

  return {
    // Regex may be coming from the user, thus disable strict mode
    // eslint-disable-next-line require-unicode-regexp
    pattern: regExpString === null ? undefined : new RegExp(regExpString),
    title,
    formatters: [stringGuard(formatter.parse.bind(formatter))],
    validators: [
      (value) => (value === undefined || value === null ? title : undefined),
    ],
    placeholder: formatter.pattern() ?? undefined,
    parser: (value: unknown): string =>
      formatter.canonicalize(value as RA<string>),
    value: canAutoNumber ? formatter.valueOrWild() : undefined,
  };
}

/**
 * Convert parser to HTML input field's validation attributes.
 *
 * @remarks
 * The attributes work for usages both in React and non-React contexts
 */
export const getValidationAttributes = (parser: Parser): IR<string> => ({
  ...(parser.required === true
    ? // A hack to make these attributes work both in JSX and native
      { required: true as unknown as string }
    : {}),
  ...(typeof parser.pattern === 'object'
    ? {
        pattern: browserifyRegex(parser.pattern),
      }
    : {}),
  ...Object.fromEntries(
    [
      'minLength',
      'maxLength',
      'min',
      'max',
      'step',
      'title',
      'placeholder',
      'type',
    ]
      .filter((attribute) => parser[attribute as keyof Parser] !== undefined)
      .map((attribute) => [
        attribute,
        `${parser[attribute as keyof Parser] as string}`,
      ])
  ),
});

/** Remove /^ and $/gu from the regex */
export const browserifyRegex = (regex: RegExp): string =>
  regex.source.replaceAll(/^\^|\$$/gu, '');

/** Modify the parser to be able to parse multiple values separated by commas */
export function pluralizeParser(rawParser: Parser): Parser {
  const { minLength = 0, maxLength, ...parser } = rawParser;

  return {
    ...parser,
    pattern:
      f.maybe(parser.pattern, pluralizeRegex) ??
      pluralizeRegex(lengthToRegex(minLength, maxLength)),
  };
}

// FEATURE: allow customizing this
const separator = ',';

/** Modify a regex pattern to allow a comma separate list of values */
export function pluralizeRegex(regex: RegExp): RegExp {
  const pattern = browserifyRegex(regex);
  // Pattern with whitespace
  const escaped = `\\s*(?:${pattern})\\s*`;
  return new RegExp(
    `^(?:|${escaped}(?:${separator}${escaped})*)$`,
    regex.flags
  );
}

/** Create a regex for matching min length and max length */
export const lengthToRegex = (
  minLength: number,
  maxLength: number | undefined
): RegExp => new RegExp(`^.{${minLength},${maxLength ?? ''}}$`, 'u');
