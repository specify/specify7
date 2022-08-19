import { formsText } from '../localization/forms';
import type { IR } from '../types';
import type { InvalidParseResult, Parser, ValidParseResult } from '../uiparse';
import { parseValue, resolveParser } from '../uiparse';

const ensureValid = (parser: Parser, values: IR<unknown>): void =>
  Object.entries(values).forEach(([raw, parsedValue]) =>
    test(`"${raw}" is valid`, () => {
      const parsed = parseValue(parser, undefined, raw);
      expectValid(parsed, parsedValue);
    })
  );

function expectValid(
  result: InvalidParseResult | ValidParseResult,
  value
): void {
  expect(result.isValid).toBe(true);
  if (!result.isValid) expect(result.value).toBe(value);
}

const ensureInvalid = (parser: Parser, values: IR<string>): void =>
  Object.entries(values).forEach(([raw, parsedValue]) =>
    test(`"${raw}" is invalid`, () => {
      const parsed = parseValue(parser, undefined, raw);
      expectInvalid(parsed, parsedValue);
    })
  );

function expectInvalid(
  result: InvalidParseResult | ValidParseResult,
  message
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
  expectInvalid(result, formsText('requiredField'));
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
  const result = parseValue(parser, undefined, '');
  expectInvalid(result, formsText('requiredField'));
});

describe('Boolean', () => {
  const parser = resolveParser({
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

  ensureInvalid(parser, {});
});

describe('Double', () => {
  const parser = resolveParser({
    type: 'java.lang.Double',
    isRequired: true,
  });

  ensureValid(parser, {
    100: 100,
    '1.5': 1.5,
    '-32e4': -320_000,
  });

  ensureInvalid(parser, {
    foo: formsText('inputTypeNumber'),
  });
});

describe('Integer', () => {
  const parser = resolveParser({
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
    foo: formsText('inputTypeNumber'),
  });
});

describe('String', () => {
  const maxLength = 3;
  const parser = resolveParser({
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
    '': formsText('requiredField'),
    // Values are trimmed before being validated
    '  ': formsText('requiredField'),
  });
});
