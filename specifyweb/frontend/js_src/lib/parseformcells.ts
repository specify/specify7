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
import { f } from './wbplanviewhelper';

// Parse column width definitions
export const processColumnDefinition = (
  columnDefinition: string
): RA<number | undefined> =>
  (columnDefinition.endsWith(',p:g')
    ? columnDefinition.slice(0, -1 * ',p:g'.length)
    : columnDefinition
  )
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
      viewName: string | undefined;
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
  readonly Blank: State<'Blank'>;
};

export const cellAlign = ['left', 'center', 'right'] as const;

/** Fix for "getAttribute" being case-sensetive for non-HTML elements */
export const getAttribute = (cell: Element, name: string): string | undefined =>
  cell.getAttribute(name.toLowerCase()) ?? undefined;

const processCellType: {
  readonly [KEY in keyof CellTypes]: (props: {
    readonly cell: Element;
    readonly model: SpecifyModel | undefined;
    readonly properties: IR<string | undefined>;
  }) => CellTypes[KEY];
} = {
  Field({ cell, model, properties }) {
    const rawFieldName = getAttribute(cell, 'name')?.replace(
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
        getAttribute(cell, 'isRequired')?.toLowerCase() === 'true' ||
        field?.isRequiredBySchemaLocalization() ||
        false,
    };
  },
  Label: ({ cell }) => ({
    type: 'Label',
    text: getAttribute(cell, 'label'),
    labelForCellId: getAttribute(cell, 'labelFor'),
    // This would be set in postProcessRows
    fieldName: undefined,
  }),
  Separator: ({ cell }) => ({
    type: 'Separator',
    label: f.maybe(getAttribute(cell, 'label'), (label) =>
      label.trim().length === 0 ? undefined : label
    ),
  }),
  SubView({ cell, model, properties }) {
    const rawFieldName = getAttribute(cell, 'name');
    const formType = getAttribute(cell, 'defaultType') ?? '';
    return {
      type: 'SubView',
      formType:
        formTypes.find(
          (type) => type.toLowerCase() === formType.toLowerCase()
        ) ?? 'form',
      fieldName: model?.getField(rawFieldName ?? '')?.name,
      viewName: getAttribute(cell, 'viewName'),
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
  /**
   * This function never actually gets called
   * Blank cell type is used by postProcessRows if definition row has fewer
   * cells than defined columns
   */
  Blank: () => ({ type: 'Blank' }),
  Unsupported: ({ cell }) => ({
    type: 'Unsupported',
    cellType: getAttribute(cell, 'type'),
  }),
};

export type FormCellDefinition = CellTypes[keyof CellTypes] & {
  readonly id: string | undefined;
  readonly align: typeof cellAlign[number];
  readonly colSpan: number;
};

const cellTypeTranslation: IR<keyof CellTypes> = {
  field: 'Field',
  label: 'Label',
  separator: 'Separator',
  subview: 'SubView',
  panel: 'Panel',
  command: 'Command',
};

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
  const cellClass = getAttribute(cellNode, 'type') ?? '';
  const cellType = cellTypeTranslation[cellClass.toLowerCase()];
  const parsedCell = processCellType[cellType] ?? processCellType.Unsupported;
  const properties = parseSpecifyProperties(
    getAttribute(cellNode, 'initialize') ?? ''
  );
  const colSpan = Number.parseInt(getAttribute(cellNode, 'colspan') ?? '');
  const align = properties.align?.toLowerCase();
  return {
    // FIXME: set as aria-labeledby
    id: getAttribute(cellNode, 'id'),
    colSpan: Number.isNaN(colSpan) ? 1 : Math.ceil(colSpan / 2),
    align: f.includes(cellAlign, align)
      ? align
      : cellType === 'Label'
      ? 'right'
      : 'left',
    ...parsedCell({ cell: cellNode, model, properties }),
  };
}
