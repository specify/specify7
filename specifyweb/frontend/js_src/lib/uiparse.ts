import dateFormatString from './dateformat.js';
import dayjs from './dayjs';
import formsText from './localization/forms';
import type { IR, RA } from './types';
import { hasNativeErrors } from './validationmessages';
import { error } from './ajax';

const stringGuard =
  (formatter: (value: string) => unknown) => (value: unknown) =>
    typeof value === 'string'
      ? formatter(value)
      : error('Value is not a string');

const formatter: IR<(value: unknown) => unknown> = {
  trim: stringGuard((value) => value.trim()),
  toLowerCase: stringGuard((value) => value.toLowerCase()),
  int: stringGuard(Number.parseInt),
  float: stringGuard(Number.parseFloat),
} as const;

const validators: IR<(value: unknown) => undefined | string> = {
  number: (value) =>
    typeof value === 'number' &&
    !Number.isNaN(value) &&
    Number.isSafeInteger(value)
      ? undefined
      : formsText('inputTypeNumber'),
} as const;

type Parser = Partial<{
  readonly type: 'text' | 'number' | 'date';
  readonly minLength: number;
  readonly maxLength: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly placeholder: string;
  readonly pattern: RegExp;
  // Browsers use this as an error message when value does not match the pattern
  readonly title: string;
  // Format a value before validating it
  readonly formatters: RA<typeof formatter[string]>;
  // Validate the value
  readonly validators: RA<typeof validators[string]>;
  // Format the value after validating it
  readonly parser: (value: unknown) => unknown;
  readonly required: boolean;
}>;

export const parsers: IR<string | Parser | ((field: Field) => Parser)> = {
  'java.lang.Boolean': {
    type: 'text',
    pattern: /\s+(?:true|false|yes|no)\s+/i,
    title: formsText('illegalBool'),
    minLength: 2,
    maxLength: 5,
    formatters: [formatter.toLowerCase],
    parser: stringGuard((value) => ['yes', 'true'].includes(value)),
  },

  'java.lang.Byte': {
    type: 'number',
    min: 0,
    max: 255,
    step: 1,
    formatters: [formatter.int],
    validators: [validators.number],
  },

  'java.lang.Double': {
    type: 'number',
    formatters: [formatter.float],
    validators: [validators.number],
  },

  'java.lang.Float': 'java.lang.Double',

  'java.lang.Long': {
    type: 'number',
    min: Number.MIN_SAFE_INTEGER,
    max: Number.MAX_SAFE_INTEGER,
    step: 1,
    formatters: [formatter.int],
    validators: [validators.number],
  },

  'java.lang.Integer': {
    type: 'number',
    min: -(2 ** 31),
    max: 2 ** 31,
    step: 1,
    formatters: [formatter.int],
    validators: [validators.number],
  },

  'java.lang.Short': {
    type: 'number',
    min: -1 << 15,
    max: 1 << 15,
    step: 1,
    formatters: [formatter.int],
    validators: [validators.number],
  },

  'java.lang.String': {
    type: 'text',
    maxLength: 2 ** 31 - 1,
  },

  'java.math.BigDecimal': 'java.lang.Double',

  'java.sql.Timestamp': {
    type: 'date',
    minLength: dateFormatString().length,
    maxLength: dateFormatString().length,
    formatters: [
      formatter.toLowerCase,
      stringGuard((value) =>
        value === 'today' ? dayjs() : dayjs(value, dateFormatString(), true)
      ),
    ],
    validators: [
      (value) =>
        (value as any).isValid()
          ? undefined
          : formsText('requiredFormat')(dateFormatString()),
    ],
    title: formsText('requiredFormat')(dateFormatString()),
    parser: (value) => (value as any).format('YYYY-MM-DD'),
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
  },

  month: {
    type: 'number',
    min: 1,
    max: 12,
    step: 1,
    formatters: [formatter.int],
    validators: [validators.number],
  },

  day: {
    type: 'number',
    min: 1,
    max: 31,
    step: 1,
    formatters: [formatter.int],
    validators: [validators.number],
  },

  text: {
    type: 'text',
  },
};

type Field = {
  readonly length?: number;
  readonly type: string;
  readonly isRequired?: boolean;
  readonly datePart?: 'fullDate' | 'year' | 'month' | 'day';
};

export function getParser(field: Field): Parser | undefined {
  let parser = parsers[field.type];
  if (typeof parser === 'string') parser = parsers[parser];
  if (typeof parser === 'function') parser = parser(field);
  if (typeof parser !== 'object') return undefined;

  if (parser.type === 'date' && typeof field.datePart !== 'undefined')
    parser =
      field.datePart === 'fullDate'
        ? {
            ...parser,
            type: 'text',
          }
        : (parsers[field.datePart] as Parser);

  return mergeParsers(parser, {
    required: field.isRequired === true,
    maxLength: field.length,
  });
}

function mergeParsers(base?: Parser, extra?: Parser): Parser | undefined {
  const concat = ['formatters', 'validators'] as const;
  const takeMin = ['max', 'step', 'maxLength'] as const;
  const takeMax = ['min', 'minLength'] as const;

  const merged = Object.fromEntries(
    [
      ...Object.entries(base ?? {}),
      ...Object.entries(extra ?? {}),
      ...concat.map((key) => [
        key,
        [...(base?.[key] ?? []), ...(extra?.[key] ?? [])],
      ]),
      ...[
        ...takeMin.map((key) => [
          key,
          Math.min(
            ...[base?.[key], extra?.[key]].filter(
              (value): value is number => typeof value === 'number'
            )
          ),
        ]),
        ...takeMax.map((key) => [
          key,
          Math.max(
            ...[base?.[key], extra?.[key]].filter(
              (value): value is number => typeof value === 'number'
            )
          ),
        ]),
      ].filter(([_key, value]) => Number.isFinite(value)),
    ].filter(([_key, value]) => typeof value !== 'undefined')
  );

  return Object.keys(merged).length === 0 ? undefined : merged;
}

type Formatter = {
  readonly parseRegexp: () => string;
  readonly pattern: () => null | string;
  readonly value: () => string;
  readonly parse: (value: string) => null | Readonly<[string]>;
  readonly canonicalize: (values: RA<string>) => string;
};

function formatterToParser(formatter: Formatter): Parser {
  const regExpString = formatter.parseRegexp();
  const title = formsText('requiredFormat')(
    formatter.pattern() ?? formatter.value()
  );

  return {
    pattern: regExpString === null ? undefined : new RegExp(regExpString),
    title,
    formatters: [stringGuard(formatter.parse.bind(formatter))],
    validators: [(value) => (value === null ? title : undefined)],
    placeholder: formatter.pattern() ?? undefined,
    parser: (value: unknown): string =>
      formatter.canonicalize(value as RA<string>),
  };
}

export function resolveParser(
  field: Field,
  formatter?: Formatter
): Parser | undefined {
  return mergeParsers(
    getParser(field),
    typeof formatter === 'undefined' ? {} : formatterToParser(formatter)
  );
}

export function addValidationAttributes(
  input: HTMLInputElement,
  field: Field,
  parser: Parser
): void {
  if (typeof parser === 'undefined') {
    console.error(formsText('noParser')(field.type));
    return;
  }

  if (parser.required === true) input.required = true;

  if (typeof parser.pattern === 'object')
    input.pattern = parser.pattern.toString().replaceAll(/^\/\^?|\$?\/$/g, '');

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
    .filter(
      (attribute) => typeof parser[attribute as keyof Parser] !== 'undefined'
    )
    .forEach((attribute) =>
      input.setAttribute(
        attribute,
        `${parser[attribute as keyof Parser] as string}`
      )
    );
}

function validateAttributes(
  parser: Parser,
  value: string,
  input: HTMLInputElement | undefined
): undefined | string {
  if (typeof input !== 'undefined' && hasNativeErrors(input))
    return input.validationMessage;

  if (typeof parser.minLength === 'number' && value.length < parser.minLength)
    return formsText('minimumLength')(parser.minLength);

  if (typeof parser.minLength === 'number' && value.length < parser.minLength)
    return formsText('maximumLength')(parser.minLength);

  if (
    typeof parser.min === 'number' &&
    !Number.isNaN(Number.parseInt(value)) &&
    Number.parseInt(value) < parser.min
  )
    return formsText('minimumNumber')(parser.min);

  if (
    typeof parser.max === 'number' &&
    !Number.isNaN(Number.parseInt(value)) &&
    Number.parseInt(value) > parser.max
  )
    return formsText('maximumNumber')(parser.max);

  if (
    typeof parser.step === 'number' &&
    !Number.isNaN(Number.parseFloat(value)) &&
    (Number.parseFloat(value) / parser.step) % 1 !== 0
  )
    return formsText('wrongStep')(parser.step);

  if (typeof parser.pattern === 'object' && parser.pattern.exec(value) === null)
    return (
      parser.title ?? formsText('requiredFormat')(parser.pattern.toString())
    );

  return undefined;
}

export type UiParseResult =
  | {
      readonly value: string;
      readonly parsed: unknown;
      readonly isValid: true;
    }
  | {
      readonly value: string;
      readonly isValid: false;
      readonly reason: string;
    };

export default function parse(
  field: Field,
  parser: Parser | undefined,
  input: HTMLInputElement | undefined,
  value: string
): UiParseResult {
  if (value.trim() === '')
    return field.isRequired === true
      ? {
          value,
          isValid: false,
          reason: formsText('requiredField'),
        }
      : {
          value,
          isValid: true,
          parsed: null,
        };

  if (typeof parser === 'undefined')
    return {
      value,
      isValid: false,
      reason: formsText('noParser')(field.type),
    };

  let errorMessage = validateAttributes(parser, value.trim(), input);
  let formattedValue: unknown;

  if (typeof errorMessage === 'undefined') {
    formattedValue = (parser.formatters ?? []).reduce<unknown>(
      (value, formatter) => formatter(value),
      value.trim()
    );

    (parser.validators ?? []).some(
      (validator) => (errorMessage = validator(formattedValue))
    );
  }

  return typeof errorMessage === 'string'
    ? {
        value,
        isValid: false,
        reason: errorMessage,
      }
    : {
        value,
        isValid: true,
        parsed: parser.parser?.(formattedValue) ?? formattedValue,
      };
}
