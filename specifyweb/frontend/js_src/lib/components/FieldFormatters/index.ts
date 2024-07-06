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
import type { FieldFormatter, FieldFormatterField } from './spec';
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

  public get defaultValue(): string {
    return this.fields.map((field) => field.defaultValue).join('');
  }

  public get placeholder(): string {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    return this.regexPlaceholder || this.defaultValue;
  }

  public get regex(): RegExp {
    // Regex may be coming from the user, thus disable strict mode
    // eslint-disable-next-line require-unicode-regexp
    return new RegExp(
      `^${this.fields
        .map((field) => `(${field.placeholderOrValueAsRegex})`)
        .join('')}$`
    );
  }

  public get regexPlaceholder(): LocalizedString | undefined {
    const placeholders = this.fields
      .map((field) => field.regexPlaceholder)
      .filter(Boolean)
      .join('\n');
    return placeholders.length > 0 ? localized(placeholders) : undefined;
  }

  public parse(value: string): RA<string> | undefined {
    const match = this.regex.exec(value);
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
}

abstract class Field {
  public readonly size: number;

  public readonly placeholder: LocalizedString;

  public readonly regexPlaceholder: LocalizedString | undefined;

  private readonly autoIncrement: boolean;

  private readonly byYear: boolean;

  public constructor({
    size,
    placeholder,
    autoIncrement,
    byYear,
    regexPlaceholder,
  }: Omit<FieldFormatterField, 'type'>) {
    this.size = size;
    this.placeholder = placeholder;
    this.autoIncrement = autoIncrement;
    this.byYear = byYear;
    this.regexPlaceholder = regexPlaceholder;
  }

  public get placeholderAsRegex(): LocalizedString {
    return localized(escapeRegExp(this.placeholder));
  }

  public get placeholderOrValueAsRegex(): LocalizedString {
    const regex = this.regex;
    if (!this.canAutonumber()) return this.regex;

    const placeholderAsRegex = this.placeholderAsRegex;
    return placeholderAsRegex === regex
      ? regex
      : localized(`${placeholderAsRegex}|${regex}`);
  }

  public get defaultValue(): LocalizedString {
    return this.placeholder === 'YEAR'
      ? localized(new Date().getFullYear().toString())
      : this.placeholder;
  }

  public abstract get regex(): LocalizedString;

  public canAutonumber(): boolean {
    return this.autoIncrement || this.byYear;
  }

  public canonicalize(value: string): LocalizedString {
    return localized(value);
  }
}

class ConstantField extends Field {
  public get regex(): LocalizedString {
    return this.placeholderAsRegex;
  }
}

class AlphaField extends Field {
  public get regex(): LocalizedString {
    return localized(`[a-zA-Z]{${this.size}}`);
  }
}

class NumericField extends Field {
  public constructor(
    options: Omit<FieldFormatterField, 'placeholder' | 'type'>
  ) {
    super({
      ...options,
      placeholder: localized(''.padStart(options.size, '#')),
    });
  }

  public get regex(): LocalizedString {
    return localized(`\\d{${this.size}}`);
  }
}

class YearField extends Field {
  public get regex(): LocalizedString {
    return localized(`\\d{${this.size}}`);
  }
}

class AlphaNumberField extends Field {
  public get regex(): LocalizedString {
    return localized(`[a-zA-Z0-9]{${this.size}}`);
  }
}

class AnyCharField extends Field {
  public get regex(): LocalizedString {
    return localized(`.{${this.size}}`);
  }
}

class RegexField extends Field {
  public get regex(): LocalizedString {
    return this.placeholder;
  }
}

class SeparatorField extends ConstantField {}

class CatalogNumberNumericField extends NumericField {
  public get regex(): LocalizedString {
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
          regexPlaceholder: undefined,
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
