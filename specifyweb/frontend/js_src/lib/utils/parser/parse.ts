import { syncFieldFormat } from '../../components/Formatters/fieldFormat';
import type { Input } from '../../components/Forms/validationHelpers';
import { hasNativeErrors } from '../../components/Forms/validationHelpers';
import { formsText } from '../../localization/forms';
import { f } from '../functools';
import { mappedFind } from '../utils';
import type { Parser } from './definitions';
import { resolveParser } from './definitions';

export type ValidParseResult = {
  readonly value: string;
  readonly parsed: unknown;
  readonly isValid: true;
};

export type InvalidParseResult = {
  readonly value: string;
  readonly isValid: false;
  readonly reason: string;
};

export function parseValue(
  parser: Parser,
  input: Input | undefined,
  value: string,
  trim: boolean = !parser.whiteSpaceSensitive
): InvalidParseResult | ValidParseResult {
  if (!parser.whiteSpaceSensitive && trim && value.trim() === '')
    return parser.required === true
      ? {
          value,
          isValid: false,
          reason: formsText.requiredField(),
        }
      : {
          value,
          isValid: true,
          parsed: null,
        };

  let errorMessage =
    typeof input === 'object' && hasNativeErrors(input)
      ? input.validationMessage
      : undefined;
  let formattedValue: unknown;

  if (errorMessage === undefined) {
    formattedValue = (parser.formatters ?? []).reduce<unknown>(
      (value, formatter) => formatter(value),
      trim ? value.trim() : value
    );

    errorMessage = mappedFind(parser.validators ?? [], (validator) =>
      validator(formattedValue)
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

const boolParser = f.store(() =>
  resolveParser(
    {},
    {
      type: 'java.lang.Boolean',
    }
  )
);

export function parseBoolean(value: string): boolean {
  const parsed = parseValue(boolParser(), undefined, value);
  return parsed.isValid && parsed.parsed === true;
}

export const booleanFormatter = (value: boolean): string =>
  syncFieldFormat(undefined, value, boolParser());
