import { escapeRegExp } from './escaperegexp';
import { load } from './initialcontext';
import SpecifyModel from './specifymodel';
import type { IR, RA } from './types';

export let uiFormatters: IR<UiFormatter>;
export const fetchContext = load<Document>(
  '/context/app.resource?name=UIFormatters',
  'application/xml'
).then((formatters) => {
  uiFormatters = Object.fromEntries(
    Array.from(formatters.getElementsByTagName('format'), (formatter) => {
      const external = formatter
        .getElementsByTagName('external')[0]
        ?.textContent?.trim();
      let resolvedFormatter;
      if (typeof external === 'string') {
        if (
          SpecifyModel.parseClassName(external) ===
          'CatalogNumberUIFieldFormatter'
        )
          resolvedFormatter = new CatalogNumberNumeric();
        else return undefined;
      } else {
        const fields = Array.from(
          formatter.getElementsByTagName('field'),
          (field) => {
            const FieldClass =
              fieldMapper[
                (field.getAttribute('type') ?? '') as keyof typeof fieldMapper
              ];
            if (typeof FieldClass === 'undefined') return undefined;
            return new FieldClass({
              size: Number.parseInt(field.getAttribute('size') ?? '1'),
              value: field.getAttribute('value') ?? ' ',
              autoIncrement: field.getAttribute('inc') === 'true',
              byYear: field.getAttribute('byyear') === 'true',
              pattern: field.getAttribute('pattern') ?? '',
            });
          }
        ).filter((field): field is Field => typeof field === 'object');
        resolvedFormatter = new UiFormatter(
          formatter.getAttribute('system') === 'true',
          fields
        );
      }

      return [formatter.getAttribute('name') ?? '', resolvedFormatter];
    }).filter(
      (entry): entry is [string, UiFormatter] => typeof entry === 'object'
    )
  );
  return uiFormatters;
});

export class UiFormatter {
  public readonly fields: RA<Field>;

  public readonly isSystem: boolean;

  public constructor(isSystem: boolean, fields: RA<Field>) {
    this.isSystem = isSystem;
    this.fields = fields;
  }

  public value(): string {
    return this.fields.map((field) => field.value).join('');
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

  protected wildRegexp(): string {
    return escapeRegExp(this.value);
  }

  public wildOrValueRegexp(): string {
    return this.canAutonumber()
      ? `${this.wildRegexp()}|${this.valueRegexp()}`
      : this.valueRegexp();
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
