import type { State } from 'typesafe-reducer';

import type { FormType, ParsedFormDefinition } from './parseform';
import { formTypes, parseFormDefinition } from './parseform';
import type { FormFieldDefinition } from './parseformfields';
import { parseFormCell } from './parseformfields';
import type { CommandDefinition } from './parseuicommands';
import { parseUiCommand } from './parseuicommands';
import type { IR, RA } from './types';
import { defined, filterArray } from './types';

// Parse column width definitions
export const processColumnDefinition = (
  columnDefinition: string
): RA<number | undefined> =>
  columnDefinition
    .split(',')
    .filter((_, index) => index % 2 === 0)
    .map((definition) => /(\d+)px/.exec(definition)?.[1])
    .map((width) =>
      typeof width === 'string' ? Number.parseInt(width) : Number.NaN
    )
    .map((width) => (Number.isNaN(width) ? undefined : width));

// FIXME: look for usages
export const parseSpecifyProperties = (props = ''): IR<string> =>
  Object.fromEntries(
    filterArray(
      props.split(';').map((line) => /([^=]+)=(.+)/.exec(line)?.slice(1, 3))
    )
  );

export type CellTypes = {
  readonly Field: State<
    'Field',
    {
      fieldName: string;
      fieldDefinition: FormFieldDefinition;
      isRequired: boolean;
    }
  >;
  readonly Label: State<
    'Label',
    {
      text: string | undefined;
      labelForCellId: number | undefined;
    }
  >;
  readonly Separator: State<
    'Separator',
    {
      readonly label: string | undefined;
    }
  >;
  readonly SubView: State<
    'SubView',
    {
      name: string | undefined;
      viewName: string | undefined;
      defaultType: FormType;
      // FIXME: get rid of this
      properties: IR<string>;
      isButton: boolean;
      align: typeof cellAlign[number] | undefined;
    }
  >;
  readonly Panel: State<'Panel', ParsedFormDefinition>;
  readonly Command: State<
    'Command',
    {
      commandDefinition: CommandDefinition;
    }
  >;
  readonly Unsupported: State<
    'Unsupported',
    {
      readonly cellType: string | undefined;
    }
  >;
};

const cellAlign = ['left', 'center', 'right'] as const;

const processCellType: {
  readonly [KEY in keyof CellTypes]: (cell: Element) => CellTypes[KEY];
} = {
  Field(cell) {
    const fieldName = defined(cell.getAttribute('name') ?? undefined).replace(
      // Hack for QueryComboBox search fields that have spurious prefixes.
      /^(\w+\.)*/,
      ''
    );
    // TODO: parse field
    const initialize = cell.getAttribute('initialize');
    const properties =
      typeof initialize === 'string' ? parseSpecifyProperties(initialize) : {};
    return {
      type: 'Field',
      fieldName,
      fieldDefinition: parseFormCell(cell, properties),
      isRequired: cell.getAttribute('isRequired')?.toLowerCase() === 'true',
    };
  },
  Label(cell) {
    const text = cell.getAttribute('label') ?? undefined;
    const labelForCellId = Number.parseInt(cell.getAttribute('labelFor') ?? '');
    return {
      type: 'Label',
      text,
      labelForCellId: Number.isNaN(labelForCellId) ? undefined : labelForCellId,
    };
  },
  Separator: (cell) => ({
    type: 'Separator',
    label: cell.getAttribute('label') ?? undefined,
  }),
  SubView(cell) {
    const name = cell.getAttribute('name') ?? undefined;
    const viewName = cell.getAttribute('viewName') ?? undefined;
    const defaultType = cell.getAttribute('defaultType') ?? '';
    const initialize = parseSpecifyProperties(
      cell.getAttribute('initialize') ?? ''
    );
    const isButton = initialize.btn.toLowerCase() === 'true';
    return {
      type: 'SubView',
      properties:
        typeof initialize === 'string'
          ? parseSpecifyProperties(initialize)
          : {},
      defaultType: formTypes.includes(defaultType as FormType)
        ? (defaultType as FormType)
        : ('form' as const),
      name,
      viewName,
      isButton,
      align:
        isButton &&
        cellAlign.includes(
          initialize.align.toLowerCase() as typeof cellAlign[number]
        )
          ? (initialize.align.toLowerCase() as typeof cellAlign[number])
          : undefined,
    };
  },
  Panel: (cell) => ({
    type: 'Panel',
    ...parseFormDefinition(cell),
  }),
  Command: (cell) => ({
    type: 'Command',
    commandDefinition: parseUiCommand(cell),
  }),
  Unsupported: (cell) => ({
    type: 'Unsupported',
    cellType: cell.getAttribute('type') ?? undefined,
  }),
};

export type FormCellDefinition = CellTypes[keyof CellTypes] & {
  readonly id: number | undefined;
  readonly colSpan: number | undefined;
};

const cellTypeTranslation: IR<keyof CellTypes> = {
  field: 'Field',
  label: 'Label',
  separator: 'Separator',
  subview: 'SubView',
  panel: 'Panel',
  command: 'Command',
};

// FIXME: review attribute usages once again
export function parseFormCellDefinition(cellNode: Element): FormCellDefinition {
  const cellClass = cellNode.getAttribute('node') ?? '';
  const parsedCell =
    processCellType[
      cellTypeTranslation[cellClass.toLowerCase()] ??
        cellTypeTranslation.Unsupported
    ];
  const colSpan = Number.parseInt(cellNode.getAttribute('colspan') ?? '');
  const id = Number.parseInt(cellNode.getAttribute('id') ?? '');
  return {
    // FIXME: set as aria-labeledby. Make IDs distinct
    id: Number.isNaN(id) ? undefined : id,
    colSpan: Number.isNaN(colSpan) ? undefined : Math.ceil(colSpan / 2),
    ...parsedCell(cellNode),
  };
}
