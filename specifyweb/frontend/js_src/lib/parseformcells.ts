/**
 * Parse form cell XML into a JSON structure
 */

import type { State } from 'typesafe-reducer';

import type { FormType, ParsedFormDefinition } from './parseform';
import { formTypes, parseFormDefinition } from './parseform';
import type { FormFieldDefinition } from './parseformfields';
import { parseFormCell } from './parseformfields';
import type { CommandDefinition } from './parseuicommands';
import { parseUiCommand } from './parseuicommands';
import type { SpecifyModel } from './specifymodel';
import type { IR, RA } from './types';
import { filterArray } from './types';

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
      fieldName: string | undefined;
      fieldDefinition: FormFieldDefinition;
      isRequired: boolean;
    }
  >;
  readonly Label: State<
    'Label',
    {
      text: string | undefined;
      labelForCellId: string | undefined;
      fieldName: string | undefined;
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
      fieldName: string | undefined;
      formType: FormType;
      isButton: boolean;
      icon: string | undefined;
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

export const cellAlign = ['left', 'center', 'right'] as const;

const processCellType: {
  readonly [KEY in keyof CellTypes]: (props: {
    readonly cell: Element;
    readonly model: SpecifyModel | undefined;
    readonly properties: IR<string | undefined>;
  }) => CellTypes[KEY];
} = {
  Field({ cell, model, properties }) {
    const rawFieldName = cell.getAttribute('name')?.replace(
      // Hack for QueryComboBox search fields that have spurious prefixes.
      /^(\w+\.)*/,
      ''
    );
    const field = model?.getField(rawFieldName ?? '');
    return {
      type: 'Field',
      fieldName: field?.name ?? rawFieldName,
      fieldDefinition: parseFormCell(cell, properties),
      isRequired:
        cell.getAttribute('isRequired')?.toLowerCase() === 'true' ||
        field?.isRequiredBySchemaLocalization(),
    };
  },
  Label: ({ cell }) => ({
    type: 'Label',
    text: cell.getAttribute('label') ?? undefined,
    labelForCellId: cell.getAttribute('labelFor') ?? '',
    // This would be set in postProcessRows
    fieldName: undefined,
  }),
  Separator: ({ cell }) => ({
    type: 'Separator',
    label: cell.getAttribute('label') ?? undefined,
  }),
  SubView({ cell, model, properties }) {
    const rawFieldName = cell.getAttribute('name') ?? undefined;
    const formType = cell.getAttribute('defaultType') ?? '';
    return {
      type: 'SubView',
      formType:
        formTypes.find(
          (type) => type.toLowerCase() === formType.toLowerCase()
        ) ?? 'form',
      fieldName: model?.getField(rawFieldName ?? '')?.name,
      isButton: properties.btn?.toLowerCase() === 'true',
      icon: properties.icon,
    };
  },
  Panel: ({ cell, model }) => ({
    type: 'Panel',
    ...parseFormDefinition(cell, model),
  }),
  Command: ({ cell }) => ({
    type: 'Command',
    commandDefinition: parseUiCommand(cell),
  }),
  Unsupported: ({ cell }) => ({
    type: 'Unsupported',
    cellType: cell.getAttribute('type') ?? undefined,
  }),
};

export type FormCellDefinition = CellTypes[keyof CellTypes] & {
  readonly id: string | undefined;
  readonly align: typeof cellAlign[number];
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
/**
 * Parse form cell XML into a JSON structure
 *
 * Does not depend on FormMode, FormType
 * Depends on SpecifyModel only for figuring out if field is required in
 * the schema
 */
export function parseFormCellDefinition(
  model: SpecifyModel | undefined,
  cellNode: Element
): FormCellDefinition {
  const cellClass = cellNode.getAttribute('node') ?? '';
  const parsedCell =
    processCellType[
      cellTypeTranslation[cellClass.toLowerCase()] ??
        cellTypeTranslation.Unsupported
    ];
  const properties = parseSpecifyProperties(
    cellNode.getAttribute('initialize') ?? ''
  );
  const colSpan = Number.parseInt(cellNode.getAttribute('colspan') ?? '');
  return {
    // FIXME: set as aria-labeledby
    id: cellNode.getAttribute('id') ?? undefined,
    colSpan: Number.isNaN(colSpan) ? undefined : Math.ceil(colSpan / 2),
    align: cellAlign.includes(
      properties.align?.toLowerCase() as typeof cellAlign[number]
    )
      ? (properties.align?.toLowerCase() as typeof cellAlign[number])
      : 'left',
    ...parsedCell({ cell: cellNode, model, properties }),
  };
}
