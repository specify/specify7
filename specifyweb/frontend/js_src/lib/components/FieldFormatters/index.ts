/**
 * Parse and use Specify 6 UI Formatters
 */

import type { LocalizedString } from 'typesafe-i18n';

import { formsText } from '../../localization/forms';
import { getAppResourceUrl } from '../../utils/ajax/helpers';
import type { IR, RA } from '../../utils/types';
import { filterArray, localized } from '../../utils/types';
import { escapeRegExp } from '../../utils/utils';
import { parseJavaClassName } from '../DataModel/resource';
import type { LiteralField } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import { error } from '../Errors/assert';
import { load } from '../InitialContext';
import { xmlToSpec } from '../Syncer/xmlUtils';
import type { FieldFormatter } from './spec';
import { fieldFormattersSpec } from './spec';

let uiFormatters: IR<UiFormatter>;
export const fetchContext = Promise.all([
  load<Element>(getAppResourceUrl('UIFormatters'), 'text/xml'),
  import('../DataModel/tables').then(async ({ fetchContext }) => fetchContext),
]).then(([formatters]) => {
  uiFormatters = Object.fromEntries(
    filterArray(
      xmlToSpec(formatters, fieldFormattersSpec()).fieldFormatters.map(
        (formatter) => {
          const resolvedFormatter = resolveFieldFormatter(formatter);
          return resolvedFormatter === undefined
            ? undefined
            : [formatter.name, resolvedFormatter];
        }
      )
    )
  );
  return uiFormatters;
});
export const getUiFormatters = (): typeof uiFormatters =>
  uiFormatters ?? error('Tried to access UI formatters before fetching them');

export function resolveFieldFormatter(
  formatter: FieldFormatter
): UiFormatter | undefined {
  if (typeof formatter.external === 'string') {
    return parseJavaClassName(formatter.external) ===
      'CatalogNumberUIFieldFormatter'
      ? new CatalogNumberNumeric()
      : undefined;
  } else {
    const fields = filterArray(
      formatter.fields.map((field) =>
        typeof field.type === 'string'
          ? new formatterTypeMapper[field.type](field)
          : undefined
      )
    );
    return new UiFormatter(
      formatter.isSystem,
      formatter.title ?? formatter.name,
      fields,
      formatter.table,
      formatter.field
    );
  }
}

/* eslint-disable functional/no-class */
export class UiFormatter {
  public constructor(
    public readonly isSystem: boolean,
    public readonly title: LocalizedString,
    public readonly fields: RA<Field>,
    public readonly table: SpecifyTable | undefined,
    // The field which this formatter is formatting
    public readonly field: LiteralField | undefined
  ) {}

  /**
   * Value or wildcard (placeholders)
   */
  public valueOrWild(): string {
    return this.fields.map((field) => field.getDefaultValue()).join('');
  }

  public parseRegExp(): string {
    return `^${this.fields
      .map((field) => `(${field.wildOrValueRegexp()})`)
      .join('')}$`;
  }

  public parse(value: string): RA<string> | undefined {
    // Regex may be coming from the user, thus disable strict mode
    // eslint-disable-next-line require-unicode-regexp
    const match = new RegExp(this.parseRegExp()).exec(value);
    return match?.slice(1);
  }

  public canAutonumber(): boolean {
    return this.fields.some((field) => field.canAutonumber());
  }

  public format(value: string): LocalizedString | undefined {
    const parsed = this.parse(value);
    return parsed === undefined ? undefined : this.canonicalize(parsed);
  }

  public canonicalize(values: RA<string>): LocalizedString {
    return localized(
      this.fields
        .map((field, index) => field.canonicalize(values[index]))
        .join('')
    );
  }

  public pattern(): LocalizedString | undefined {
    return this.fields.some((field) => field.pattern)
      ? localized(this.fields.map((field) => field.pattern ?? '').join(''))
      : undefined;
  }
}

abstract class Field {
  public readonly size: number;

  public readonly value: LocalizedString;

  private readonly autoIncrement: boolean;

  private readonly byYear: boolean;

  public readonly pattern: LocalizedString | undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  public type: keyof typeof formatterTypeMapper = undefined!;

  public constructor({
    size,
    value,
    autoIncrement,
    byYear,
    pattern,
  }: {
    readonly size: number;
    readonly value: LocalizedString;
    readonly autoIncrement: boolean;
    readonly byYear: boolean;
    readonly pattern?: LocalizedString;
  }) {
    this.size = size;
    this.value = value;
    this.autoIncrement = autoIncrement;
    this.byYear = byYear;
    this.pattern = pattern;
  }

  public canAutonumber(): boolean {
    return this.autoIncrement || this.byYear;
  }

  public wildRegexp(): LocalizedString {
    return localized(escapeRegExp(this.value));
  }

  public wildOrValueRegexp(): LocalizedString {
    return this.canAutonumber()
      ? localized(`${this.wildRegexp()}|${this.valueRegexp()}`)
      : this.valueRegexp();
  }

  public getDefaultValue(): LocalizedString {
    return this.value === 'YEAR'
      ? localized(new Date().getFullYear().toString())
      : this.value;
  }

  public canonicalize(value: string): LocalizedString {
    return localized(value);
  }

  public valueRegexp(): LocalizedString {
    throw new Error('not implemented');
  }
}

class ConstantField extends Field {
  public constructor(options: ConstructorParameters<typeof Field>[0]) {
    super(options);
    this.type = 'constant';
  }

  public valueRegexp(): LocalizedString {
    return this.wildRegexp();
  }
}

class AlphaField extends Field {
  public constructor(options: ConstructorParameters<typeof Field>[0]) {
    super(options);
    this.type = 'alpha';
  }

  public valueRegexp(): LocalizedString {
    return localized(`[a-zA-Z]{${this.size}}`);
  }
}

class NumericField extends Field {
  public constructor(
    options: Omit<ConstructorParameters<typeof Field>[0], 'value'>
  ) {
    super({
      ...options,
      value: localized(''.padStart(options.size, '#')),
    });
    this.type = 'numeric';
  }

  public valueRegexp(): LocalizedString {
    return localized(`\\d{${this.size}}`);
  }
}

class YearField extends Field {
  public constructor(options: ConstructorParameters<typeof Field>[0]) {
    super(options);
    this.type = 'year';
  }

  public valueRegexp(): LocalizedString {
    return localized(`\\d{${this.size}}`);
  }
}

class AlphaNumberField extends Field {
  public constructor(options: ConstructorParameters<typeof Field>[0]) {
    super(options);
    this.type = 'alphanumeric';
  }

  public valueRegexp(): LocalizedString {
    return localized(`[a-zA-Z0-9]{${this.size}}`);
  }
}

class AnyCharField extends Field {
  public constructor(options: ConstructorParameters<typeof Field>[0]) {
    super(options);
    this.type = 'anychar';
  }

  public valueRegexp(): LocalizedString {
    return localized(`.{${this.size}}`);
  }
}

class RegexField extends Field {
  public constructor(options: ConstructorParameters<typeof Field>[0]) {
    super(options);
    this.type = 'regex';
  }

  public valueRegexp(): LocalizedString {
    return this.value;
  }
}

class SeparatorField extends ConstantField {
  public constructor(options: ConstructorParameters<typeof Field>[0]) {
    super(options);
    this.type = 'separator';
  }
}

class CatalogNumberNumericField extends NumericField {
  public valueRegexp(): LocalizedString {
    return localized(`\\d{0,${this.size}}`);
  }

  public canonicalize(value: string): LocalizedString {
    return localized(value === '' ? '' : value.padStart(this.size, '0'));
  }
}

// REFACTOR: tables.CollectionObject is always undefined in the global scope
export class CatalogNumberNumeric extends UiFormatter {
  public constructor() {
    super(
      true,
      formsText.catalogNumberNumericFormatter(),
      [
        new CatalogNumberNumericField({
          size: 9,
          autoIncrement: true,
          byYear: false,
        }),
      ],
      tables.CollectionObject,
      tables.CollectionObject?.getLiteralField('catalogNumber')
    );
  }
}
/* eslint-enable functional/no-class */

export const formatterTypeMapper = {
  constant: ConstantField,
  year: YearField,
  alpha: AlphaField,
  numeric: NumericField,
  alphanumeric: AlphaNumberField,
  anychar: AnyCharField,
  regex: RegexField,
  separator: SeparatorField,
} as const;
