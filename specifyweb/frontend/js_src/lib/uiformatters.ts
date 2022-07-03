/**
 * Parse and use Specify 6 UI Formatters
 */

import { error } from './assert';
import { f } from './functools';
import {
  escapeRegExp,
  getAttribute,
  getBooleanAttribute,
  getParsedAttribute,
} from './helpers';
import { load } from './initialcontext';
import { formatUrl } from './querystring';
import { parseClassName } from './resource';
import type { IR, RA } from './types';
import { filterArray } from './types';

let uiFormatters: IR<UiFormatter>;
export const fetchContext =
  process.env.NODE_ENV === 'test'
    ? Promise.resolve<IR<UiFormatter>>({})
    : load<Document>(
        formatUrl('/context/app.resource', { name: 'UIFormatters' }),
        'application/xml'
      ).then((formatters) => {
        uiFormatters = Object.fromEntries(
          filterArray(
            Array.from(
              formatters.getElementsByTagName('format'),
              (formatter) => {
                const external = formatter
                  .getElementsByTagName('external')[0]
                  ?.textContent?.trim();
                let resolvedFormatter;
                if (typeof external === 'string') {
                  if (
                    parseClassName(external) === 'CatalogNumberUIFieldFormatter'
                  )
                    resolvedFormatter = new CatalogNumberNumeric();
                  else return undefined;
                } else {
                  const fields = filterArray(
                    Array.from(
                      formatter.getElementsByTagName('field'),
                      (field) => {
                        const FieldClass =
                          fieldMapper[
                            (getParsedAttribute(field, 'type') ??
                              '') as keyof typeof fieldMapper
                          ];
                        if (FieldClass === undefined) return undefined;
                        return new FieldClass({
                          size:
                            f.parseInt(
                              getParsedAttribute(field, 'size') ?? ''
                            ) ?? 1,
                          value: getAttribute(field, 'value') ?? ' ',
                          autoIncrement:
                            getBooleanAttribute(field, 'inc') ?? false,
                          byYear: getBooleanAttribute(field, 'byYear') ?? false,
                          pattern: getAttribute(field, 'pattern') ?? '',
                        });
                      }
                    )
                  );
                  resolvedFormatter = new UiFormatter(
                    getBooleanAttribute(formatter, 'system') ?? false,
                    fields
                  );
                }

                return [
                  getParsedAttribute(formatter, 'name') ?? '',
                  resolvedFormatter,
                ];
              }
            )
          )
        );
        return uiFormatters;
      });
export const getUiFormatters = () =>
  uiFormatters ?? error('Tried to access UI formatters before fetching them');

export class UiFormatter {
  public readonly fields: RA<Field>;

  public readonly isSystem: boolean;

  public constructor(isSystem: boolean, fields: RA<Field>) {
    this.isSystem = isSystem;
    this.fields = fields;
  }

  /**
   * Value or wildcard (placeholders)
   */
  public valueOrWild(): string {
    return this.fields.map((field) => field.getDefaultValue()).join('');
  }

  public parseRegexp(): string {
    return `^${this.fields
      .map(function (field) {
        return `(${field.wildOrValueRegexp()})`;
      })
      .join('')}$`;
  }

  public parse(value: string): RA<string> | undefined {
    const match = new RegExp(this.parseRegexp()).exec(value);
    return match?.slice(1);
  }

  public canAutonumber(): boolean {
    return this.fields.some((field) => field.canAutonumber());
  }

  public format(value: string): string | undefined {
    const parsed = this.parse(value);
    return parsed === undefined ? undefined : this.canonicalize(parsed);
  }

  public canonicalize(values: RA<string>): string {
    return this.fields
      .map((field, index) => field.canonicalize(values[index]))
      .join('');
  }

  public pattern(): string | undefined {
    return this.fields.some((field) => field.pattern)
      ? this.fields.map((field) => field.pattern ?? '').join('')
      : undefined;
  }
}

abstract class Field {
  protected readonly size: number;

  public readonly value: string;

  private readonly autoIncrement: boolean;

  private readonly byYear: boolean;

  public readonly pattern: string | undefined;

  public constructor({
    size,
    value,
    autoIncrement,
    byYear,
    pattern,
  }: {
    readonly size: number;
    readonly value: string;
    readonly autoIncrement: boolean;
    readonly byYear: boolean;
    readonly pattern?: string;
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

  public wildRegexp(): string {
    return escapeRegExp(this.value);
  }

  public wildOrValueRegexp(): string {
    return this.canAutonumber()
      ? `${this.wildRegexp()}|${this.valueRegexp()}`
      : this.valueRegexp();
  }

  public getDefaultValue(): string {
    return this.value === 'YEAR'
      ? new Date().getFullYear().toString()
      : this.value;
  }

  public canonicalize(value: string): string {
    return value;
  }

  public valueRegexp(): string {
    throw new Error('not implemented');
  }
}

class ConstantField extends Field {
  public valueRegexp(): string {
    return this.wildRegexp();
  }
}

class AlphaField extends Field {
  public valueRegexp(): string {
    return `[a-zA-Z]{${this.size}}`;
  }
}

class NumericField extends Field {
  public constructor(
    options: Omit<ConstructorParameters<typeof Field>[0], 'value'>
  ) {
    super({
      ...options,
      value: ''.padStart(options.size, '#'),
    });
  }

  public valueRegexp(): string {
    return `\\d{${this.size}}`;
  }
}

class YearField extends Field {
  public valueRegexp(): string {
    return `\\d{${this.size}}`;
  }
}

class AlphaNumberField extends Field {
  public valueRegexp(): string {
    return `[a-zA-Z0-9]{${this.size}}`;
  }
}

class AnyCharField extends Field {
  public valueRegexp(): string {
    return `.{${this.size}}`;
  }
}

class RegexField extends Field {
  public valueRegexp(): string {
    return this.value;
  }
}

class SeparatorField extends ConstantField {}

class CatalogNumberNumericField extends NumericField {
  public valueRegexp(): string {
    return `\\d{0,${this.size}}`;
  }

  public canonicalize(value: string): string {
    return value === '' ? '' : value.padStart(this.size, '0');
  }
}

class CatalogNumberNumeric extends UiFormatter {
  public constructor() {
    super(true, [
      new CatalogNumberNumericField({
        size: 9,
        autoIncrement: true,
        byYear: false,
      }),
    ]);
  }
}

const fieldMapper = {
  constant: ConstantField,
  year: YearField,
  alpha: AlphaField,
  numeric: NumericField,
  alphanumeric: AlphaNumberField,
  anychar: AnyCharField,
  regex: RegexField,
  separator: SeparatorField,
} as const;
