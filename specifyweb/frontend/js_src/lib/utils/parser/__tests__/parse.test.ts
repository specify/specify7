import { formsText } from '../../../localization/forms';
import { mockTime, requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import type { IR } from '../../types';
import { fullDateFormat } from '../dateFormat';
import type { Parser } from '../definitions';
import { resolveParser } from '../definitions';
import type { InvalidParseResult, ValidParseResult } from '../parse';
import { parseBoolean, parseValue } from '../parse';

requireContext();

const ensureValid = (
  parser: Parser | (() => Parser),
  values: IR<unknown>
): void =>
  Object.entries(values).forEach(([raw, parsedValue]) =>
    test(`"${raw}" is valid`, () => {
      const resolvedParser = typeof parser === 'function' ? parser() : parser;
      const parsed = parseValue(resolvedParser, undefined, raw);
      expectValid(parsed, parsedValue);
    })
  );

function expectValid(
  result: InvalidParseResult | ValidParseResult,
  value: unknown
): void {
  expect(result.isValid).toBe(true);
  if (!result.isValid) expect(result.value).toBe(value);
}

const ensureInvalid = (
  parser: Parser | (() => Parser),
  values: IR<string | (() => string)>
): void =>
  Object.entries(values).forEach(([raw, parsedValue]) =>
    test(`"${raw}" is invalid`, () => {
      const resolvedParser = typeof parser === 'function' ? parser() : parser;
      const expectedResults =
        typeof parsedValue === 'function' ? parsedValue() : parsedValue;
      const parsed = parseValue(resolvedParser, undefined, raw);
      expectInvalid(parsed, expectedResults);
    })
  );

function expectInvalid(
  result: InvalidParseResult | ValidParseResult,
  message: string
): void {
  expect(result.isValid).toBe(false);
  expect((result as InvalidParseResult).reason).toBe(message);
}

test('isRequired', () => {
  const parser = resolveParser({
    type: 'java.lang.Integer',
    isRequired: true,
  });
  const result = parseValue(parser, undefined, '  ');
  expectInvalid(result, formsText.requiredField());
});

test('not isRequired', () => {
  const parser = resolveParser({
    type: 'java.lang.Integer',
    isRequired: false,
  });
  const result = parseValue(parser, undefined, '  ');
  expectValid(result, null);
});

test('required String empty', () => {
  const parser = resolveParser({
    type: 'java.lang.String',
    isRequired: true,
  });
  const result = parseValue(parser, undefined, ' \n\t ');
  expectInvalid(result, formsText.requiredField());
});

test('white space sensitive', () => {
  const parser = resolveParser({
    type: 'java.lang.String',
    whiteSpaceSensitive: true,
  });
  const whiteSpaceString = ' \n\t ';
  const result = parseValue(parser, undefined, whiteSpaceString);
  expectValid(result, whiteSpaceString);
});

test('non white space sensitive', () => {
  const parser = resolveParser({
    type: 'java.lang.String',
  });
  const result = parseValue(parser, undefined, ' \n\t ');
  expectValid(result, null);
});

describe('Boolean', () => {
  const parser = () =>
    resolveParser({
      type: 'java.lang.Boolean',
      isRequired: true,
    });

  ensureValid(parser, {
    true: true,
    True: true,
    TRUE: true,
    yes: true,
    false: false,
    no: false,
    // "isRequired: true" is ignored for Booleans
    '': null,
    /*
     * Even though this is not a valid bool, it is considered valid, because
     * the validation system relies on the browser's built-in validation for
     * enforcing regex pattern match
     */
    foo: 'foo',
  });
});

describe('Double', () => {
  const parser = () =>
    resolveParser({
      type: 'java.lang.Double',
      isRequired: true,
    });

  ensureValid(parser, {
    100: 100,
    '1.5': 1.5,
    '-32e4': -320_000,
  });

  ensureInvalid(parser, {
    foo: formsText.inputTypeNumber(),
  });
});

describe('Integer', () => {
  const parser = () =>
    resolveParser({
      type: 'java.lang.Integer',
      isRequired: true,
    });

  ensureValid(parser, {
    100: 100,
    '-34': 34,
    '012': 12,
    '1.4': 1,
  });

  ensureInvalid(parser, {
    foo: formsText.inputTypeNumber(),
  });
});

describe('Short', () => {
  const parser = () =>
    resolveParser({
      type: 'java.lang.Short',
    });

  const largeNumber = (1 << 15) + 1;
  ensureValid(parser, {
    100.3: 100,
    '-34': 34,
    '': null,
    /**
     * This number is outside the bounds, but considered valid because the
     * parser relies on the browser's built-in validation for enforcing min/max
     */
    [largeNumber]: largeNumber,
  });

  ensureInvalid(parser, {
    foo: formsText.inputTypeNumber(),
  });
});

describe('String', () => {
  const maxLength = 3;
  const parser = () =>
    resolveParser({
      type: 'java.lang.String',
      isRequired: true,
      length: maxLength,
    });

  ensureValid(parser, {
    OK: 'OK',
    foo: 'foo',
    123: '123',
    /*
     * Even though this is over maxLength, it is valid, because the validation
     * system relies on the browser's built-in validation for enforcing
     * maxLength
     */
    foobar: 'foobar',
  });

  ensureInvalid(parser, {
    '': formsText.requiredField(),
    // Values are trimmed before being validated
    '  ': formsText.requiredField(),
  });
});

describe('date validation', () => {
  mockTime();

  const parser = () =>
    resolveParser({
      type: 'java.sql.Timestamp',
      isRequired: true,
    });

  ensureValid(parser, {
    '2020-01-01': '2020-01-01',
    'today + 10 days': '2020-01-01',
  });

  ensureInvalid(parser, {
    a: () => formsText.requiredFormat({ format: fullDateFormat() }),
  });
});

test('native browser validation is enforced', () => {
  const input = document.createElement('input');
  input.setAttribute('type', 'text');
  input.setAttribute('pattern', '3{2}');
  input.value = 'a';
  expectInvalid(parseValue({}, input, 'a'), 'Constraints not satisfied');
});

theories(parseBoolean, [
  { in: ['true'], out: true },
  { in: ['  TrUE  '], out: true },
  { in: [' yes'], out: true },
  { in: ['no'], out: false },
  { in: ['Nan'], out: false },
  { in: [' no! '], out: false },
  { in: ['FALSE'], out: false },
  { in: ['etc'], out: false },
]);
