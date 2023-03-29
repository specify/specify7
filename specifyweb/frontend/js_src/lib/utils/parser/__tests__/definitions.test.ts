import type {
  JavaType,
  LiteralField,
  Relationship,
} from '../../../components/DataModel/specifyField';
import {
  formatterTypeMapper,
  UiFormatter,
} from '../../../components/Forms/uiFormatters';
import { setPref } from '../../../components/UserPreferences/helpers';
import { formsText } from '../../../localization/forms';
import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { f } from '../../functools';
import { removeKey } from '../../utils';
import type { Parser } from '../definitions';
import {
  browserifyRegex,
  formatter,
  formatterToParser,
  getValidationAttributes,
  lengthToRegex,
  mergeParsers,
  parserFromType,
  parsers,
  pluralizeParser,
  pluralizeRegex,
  resolveParser,
  stringGuard,
  validators,
} from '../definitions';

requireContext();

describe('stringGuard', () => {
  test('throws on non string', () =>
    expect(() => stringGuard(f.never)(3)).toThrow('Value is not a string'));
  test('calls callback on string', () =>
    expect(stringGuard((a) => `${a}${a}`)('a')).toBe('aa'));
});

describe('parserFromType', () => {
  test('simple type is resolved', () =>
    expect(parserFromType('java.lang.Boolean')).toBe(
      parsers()['java.lang.Boolean']
    ));
  test('synonym type is resolved', () =>
    expect(parserFromType('java.math.BigDecimal')).toBe(
      parsers()['java.lang.Double']
    ));
  test('unknown returns default parser', () =>
    expect(parserFromType('unknown' as JavaType)).toEqual(parsers().text));
});

const formatterFields = [
  new formatterTypeMapper.constant({
    size: 2,
    value: 'AB',
    autoIncrement: false,
    byYear: false,
    pattern: '\\d{1,2}',
  }),
  new formatterTypeMapper.numeric({
    size: 2,
    autoIncrement: true,
    byYear: false,
    pattern: '\\d{1,2}',
  }),
];
const uiFormatter = new UiFormatter(false, formatterFields);
const title = formsText.requiredFormat({ format: uiFormatter.pattern()! });

describe('resolveParser', () => {
  test('simple string with parser merger', () => {
    expect(
      resolveParser({
        type: 'java.lang.String',
        length: 5,
        isRequired: true,
      })
    ).toEqual({
      ...parserFromType('java.lang.String'),
      maxLength: 5,
      required: true,
    });
  });
  test('month', () => {
    expect(
      resolveParser(
        { type: 'java.sql.Timestamp' },
        {
          datePart: 'month',
        }
      )
    ).toEqual({
      ...parserFromType('month'),
      required: false,
      pickListName: '_Months',
    });
  });
  test('checkboxes are not required', () => {
    expect(
      resolveParser({ type: 'java.lang.Boolean', isRequired: true })
    ).toEqual({
      ...parserFromType('java.lang.Boolean'),
      required: false,
    });
  });
  test('UiFormatter is converted to parser', () => {
    const field = {
      type: 'java.lang.String',
      getUiFormatter: () => uiFormatter,
    } as unknown as LiteralField;
    expect(
      removeKey(resolveParser(field), 'formatters', 'parser', 'validators')
    ).toEqual({
      ...parserFromType('java.lang.String'),
      required: false,
      ...removeKey(
        formatterToParser(field, uiFormatter),
        'formatters',
        'parser',
        'validators'
      ),
    });
  });
  test('relationship parser is resolved to a simple text field', () => {
    const field = {
      type: 'one-to-one',
      isRelationship: true,
    } as unknown as Relationship;
    expect(resolveParser(field)).toEqual({
      required: false,
      type: 'text',
    });
  });
});

describe('mergeParsers', () => {
  test('base case', () => expect(mergeParsers({}, {})).toEqual({}));
  test('undefined do not overwrite defined', () =>
    expect(mergeParsers({ min: 3 }, { min: undefined })).toEqual({ min: 3 }));
  test('simple case', () =>
    expect(mergeParsers({ min: 3, minLength: undefined }, { max: 4 })).toEqual({
      min: 3,
      max: 4,
    }));
  test('contact case', () =>
    expect(
      mergeParsers(
        { formatters: [formatter.toLowerCase] },
        { formatters: [formatter.trim] }
      )
    ).toEqual({ formatters: [formatter.toLowerCase, formatter.trim] }));
  test('takeMin case', () =>
    expect(mergeParsers({ step: 1 }, { step: 4 })).toEqual({ step: 1 }));
  test('takeMax case', () =>
    expect(mergeParsers({ minLength: 1 }, { minLength: 4 })).toEqual({
      minLength: 4,
    }));
  test('complex case', () => {
    const left: Parser = {
      type: 'checkbox',
      minLength: 3,
      maxLength: 7,
      min: 2,
      max: 20,
      step: 2.5,
      placeholder: formsText.illegalBool(),
      pattern: /a/u,
      title: formsText.illegalBool(),
      formatters: [formatter.toLowerCase],
      validators: [validators.number],
      parser: f.never,
      printFormatter: (a: unknown) =>
        (a as string | undefined)?.toString() ?? '',
      required: true,
      value: false,
      pickListName: 'a',
    };
    const right: Parser = {
      type: 'text',
      minLength: 4,
      maxLength: 8,
      min: 3,
      max: 21,
      step: 3.5,
      placeholder: formsText.invalidValue(),
      pattern: /b/u,
      title: formsText.invalidValue(),
      formatters: [formatter.toUpperCase],
      validators: [validators.number],
      parser: f.toString,
      printFormatter: f.toString,
      required: true,
      value: false,
      pickListName: 'a',
    };
    expect(mergeParsers(left, right)).toEqual({
      type: 'text',
      minLength: 4,
      maxLength: 7,
      min: 3,
      max: 20,
      step: 2.5,
      placeholder: formsText.invalidValue(),
      pattern: /b/u,
      title: formsText.invalidValue(),
      formatters: [formatter.toLowerCase, formatter.toUpperCase],
      validators: [validators.number, validators.number],
      parser: f.toString,
      printFormatter: f.toString,
      required: true,
      value: false,
      pickListName: 'a',
    });
  });
});

describe('formatterToParser', () => {
  test('with autonumbering', () => {
    const {
      formatters,
      validators,
      parser: parserFunction,
      ...parser
    } = formatterToParser({}, uiFormatter);
    expect(parser).toEqual({
      // Regex may be coming from the user, thus disable strict mode
      // eslint-disable-next-line require-unicode-regexp
      pattern: new RegExp(uiFormatter.parseRegExp()),
      title,
      placeholder: uiFormatter.pattern()!,
      value: uiFormatter.valueOrWild(),
    });

    expect(formatters).toBeInstanceOf(Array);
    expect(formatters).toHaveLength(1);
    expect(formatters![0]('AB12')).toEqual(['AB', '12']);

    expect(validators).toBeInstanceOf(Array);
    expect(validators).toHaveLength(1);
    expect(validators![0](undefined)).toBe(title);
    expect(validators![0](null)).toBe(title);
    expect(validators![0]('a')).toBeUndefined();

    expect(parserFunction).toBeInstanceOf(Function);
    expect(parserFunction!(['AB', '12'])).toBe('AB12');
  });

  test('without autonumbering', () => {
    const field = {
      model: {
        name: 'CollectionObject',
      },
      name: 'altCatalogNumber',
    } as unknown as LiteralField;
    setPref('form', 'preferences', 'autoNumbering', {
      CollectionObject: [],
    });
    expect(formatterToParser(field, uiFormatter).value).toBeUndefined();
  });
});

theories(getValidationAttributes, [
  { in: [{}], out: {} },
  {
    in: [{ required: true, pattern: /^a$/u }],
    out: {
      required: true as unknown as string,
      pattern: 'a',
    },
  },
  { in: [{ min: 3, max: 4 }], out: { min: '3', max: '4' } },
  {
    in: [{ placeholder: 'a', title: 'b' }],
    out: { placeholder: 'a', title: 'b' },
  },
]);

theories(browserifyRegex, [
  { in: [/[5a]/u], out: '[5a]' },
  { in: [/^a$/mu], out: 'a' },
]);

theories(pluralizeParser, [
  {
    in: [{ title: 'a', pattern: /^a$/u }],
    out: {
      title: 'a',
      /*
       * The below regex is autogenerated
       */
      // eslint-disable-next-line regexp/no-empty-alternative, regexp/no-useless-non-capturing-group
      pattern: new RegExp('^(?:|\\s*(?:a)\\s*(?:,\\s*(?:a)\\s*)*)$', 'u'),
    },
  },
]);

theories(pluralizeRegex, [
  /*
   * The below regex is autogenerated
   */
  // eslint-disable-next-line regexp/no-empty-alternative, regexp/no-useless-non-capturing-group
  [[/^a$/u], new RegExp('^(?:|\\s*(?:a)\\s*(?:,\\s*(?:a)\\s*)*)$', 'u')],
]);

theories(lengthToRegex, [
  { in: [3, undefined], out: /^.{3,}$/u },
  { in: [3, 5], out: /^.{3,5}$/u },
]);
