/**
 * Parse form cell XML into a JSON structure
 */

import type { State } from 'typesafe-reducer';

import { f } from './functools';
import type { FormType, ParsedFormDefinition } from './parseform';
import { formTypes, parseFormDefinition } from './parseform';
import type { FormFieldDefinition } from './parseformfields';
import { parseFormField } from './parseformfields';
import type { CommandDefinition } from './parseuicommands';
import { parseUiCommand } from './parseuicommands';
import type { SpecifyModel } from './specifymodel';
import type { IR, RA } from './types';
import { filterArray } from './types';

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
    .map((definition) => /(\d+)px/.exec(definition)?.[1] ?? '')
    .map(f.parseInt);

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
      title: string | undefined;
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
      sortField: string | undefined;
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
    const fieldDefinition = parseFormField(cell, properties);
    /*
     * Some plugins overwrite the fieldName. In such cases, the [name] attribute
     * is commonly "this"
     */
    const fieldName =
      fieldDefinition.type === 'Plugin' &&
      fieldDefinition.pluginDefinition.type === 'LatLonUI'
        ? undefined
        : (fieldDefinition.type === 'Plugin'
            ? fieldDefinition.pluginDefinition.type === 'PartialDateUI'
              ? fieldDefinition.pluginDefinition.dateField
              : fieldDefinition.pluginDefinition.type ===
                  'CollectionRelOneToManyPlugin' ||
                fieldDefinition.pluginDefinition.type === 'ColRelTypePlugin'
              ? fieldDefinition.pluginDefinition.relationship
              : undefined
            : undefined) ??
          field?.name ??
          rawFieldName;
    return {
      type: 'Field',
      fieldName,
      fieldDefinition,
      isRequired:
        getAttribute(cell, 'isRequired')?.toLowerCase() === 'true' ||
        field?.isRequiredBySchemaLocalization() ||
        false,
    };
  },
  Label: ({ cell }) => ({
    type: 'Label',
    // This may be overwritten in postProcessRows
    text: f.maybe(getAttribute(cell, 'label')?.trim(), (text) =>
      text.length === 0 ? undefined : text
    ),
    // This would be set in postProcessRows
    title: undefined,
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
    const field = model?.getField(rawFieldName ?? '');
    return {
      type: 'SubView',
      formType:
        formTypes.find(
          (type) => type.toLowerCase() === formType.toLowerCase()
        ) ?? 'form',
      fieldName: field?.name,
      viewName: getAttribute(cell, 'viewName'),
      isButton: properties.btn?.toLowerCase() === 'true',
      icon: properties.icon,
      sortField: field?.isRelationship
        ? field?.relatedModel?.getField(properties.sortfield ?? '')?.name ??
          undefined
        : undefined,
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
  readonly visible: boolean;
  readonly ariaLabel: string | undefined;
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
export function parseFormCell(
  model: SpecifyModel | undefined,
  cellNode: Element
): FormCellDefinition {
  const cellClass = getAttribute(cellNode, 'type') ?? '';
  const cellType = cellTypeTranslation[cellClass.toLowerCase()];
  const parsedCell = processCellType[cellType] ?? processCellType.Unsupported;
  const properties = parseSpecifyProperties(
    getAttribute(cellNode, 'initialize') ?? ''
  );
  const colSpan = f.parseInt(getAttribute(cellNode, 'colspan') ?? '');
  const align = properties.align?.toLowerCase();
  return {
    id: getAttribute(cellNode, 'id'),
    colSpan: typeof colSpan === 'number' ? Math.ceil(colSpan / 2) : 1,
    align: f.includes(cellAlign, align)
      ? align
      : cellType === 'Label'
      ? 'right'
      : 'left',
    visible: properties.visible?.toLowerCase() !== 'false',
    ...parsedCell({ cell: cellNode, model, properties }),
    // This mag get filled out in postProcessRows or parseFormTableDefinition
    ariaLabel: undefined,
  };
}
