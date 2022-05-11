/**
 * Parse form cell XML into a JSON structure
 */

import type { State } from 'typesafe-reducer';

import { f } from './functools';
import {
  getAttribute,
  getBooleanAttribute,
  getParsedAttribute,
} from './helpers';
import type { FormType, ParsedFormDefinition } from './parseform';
import { parseFormDefinition } from './parseform';
import type { FormFieldDefinition } from './parseformfields';
import { parseFormField } from './parseformfields';
import type { CommandDefinition } from './parseuicommands';
import { parseUiCommand } from './parseuicommands';
import type { SpecifyModel } from './specifymodel';
import { legacyLocalize } from './stringlocalization';
import type { IR, RA } from './types';
import { filterArray } from './types';
import { Tables } from './datamodel';
import { getModel } from './schema';

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
    ).map(([key, value]) => [key.toLowerCase(), value])
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
      label: string | undefined;
      icon: string | undefined;
      forClass: keyof Tables | undefined;
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
  readonly Panel: State<
    'Panel',
    ParsedFormDefinition & { display: 'block' | 'inline' }
  >;
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

const processCellType: {
  readonly [KEY in keyof CellTypes]: (props: {
    readonly cell: Element;
    readonly model: SpecifyModel | undefined;
    readonly getProperty: (name: string) => string | undefined;
  }) => CellTypes[KEY];
} = {
  Field({ cell, model, getProperty }) {
    let rawFieldName = getParsedAttribute(cell, 'name');
    const parts = rawFieldName?.split('.');
    /*
     * If model is attachment, and field name is attachment.type, replace it
     * with "type"
     */
    if (
      Array.isArray(parts) &&
      parts.length > 1 &&
      parts[0].toLowerCase() === model?.name.toLowerCase()
    )
      rawFieldName = parts?.slice(1).join('.');
    const field = model?.getField(rawFieldName ?? '');
    const fieldDefinition = parseFormField(cell, getProperty);
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
            : undefined) ?? rawFieldName;
    return {
      type: 'Field',
      fieldName,
      fieldDefinition,
      isRequired:
        getBooleanAttribute(cell, 'isRequired') ??
        field?.isRequiredBySchemaLocalization() ??
        false,
    };
  },
  Label: ({ cell }) => ({
    type: 'Label',
    // This may be overwritten in postProcessRows
    text: f.maybe(getParsedAttribute(cell, 'label'), legacyLocalize),
    // This would be set in postProcessRows
    title: undefined,
    labelForCellId: getParsedAttribute(cell, 'labelFor'),
    // This would be set in postProcessRows
    fieldName: undefined,
  }),
  Separator: ({ cell }) => ({
    type: 'Separator',
    label: getParsedAttribute(cell, 'label'),
    icon: getParsedAttribute(cell, 'icon'),
    forClass: f.maybe(
      getParsedAttribute(cell, 'forClass'),
      (forClass) => getModel(forClass)?.name
    ),
  }),
  SubView({ cell, model, getProperty }) {
    const rawFieldName = getParsedAttribute(cell, 'name');
    const formType = getParsedAttribute(cell, 'defaultType') ?? '';
    const field = model?.getField(rawFieldName ?? '');
    return {
      type: 'SubView',
      formType: formType?.toLowerCase() === 'table' ? 'formTable' : 'form',
      fieldName: field?.name,
      viewName: getParsedAttribute(cell, 'viewName'),
      isButton: getProperty('btn')?.toLowerCase() === 'true',
      icon: getProperty('icon'),
      sortField: field?.isRelationship
        ? field?.relatedModel?.getField(getProperty('sortField') ?? '')?.name ??
          undefined
        : undefined,
    };
  },
  Panel: ({ cell, model }) => ({
    type: 'Panel',
    ...parseFormDefinition(cell, model),
    display: 'paneltype',
  }),
  Command: ({ cell }) => ({
    type: 'Command',
    commandDefinition: parseUiCommand(cell),
  }),
  /**
   * This function never actually gets called
   * Blank cell type is used by postProcessRows if row definition has fewer
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
  const cellClass = getParsedAttribute(cellNode, 'type') ?? '';
  const cellType = cellTypeTranslation[cellClass.toLowerCase()];
  const parsedCell = processCellType[cellType] ?? processCellType.Unsupported;
  const properties = parseSpecifyProperties(
    getAttribute(cellNode, 'initialize') ?? ''
  );
  const getProperty = (name: string): string | undefined =>
    properties[name.toLowerCase()];
  const colSpan = f.parseInt(getParsedAttribute(cellNode, 'colspan') ?? '');
  const align = getProperty('align')?.toLowerCase();
  return {
    id: getParsedAttribute(cellNode, 'id'),
    colSpan: typeof colSpan === 'number' ? Math.ceil(colSpan / 2) : 1,
    align: f.includes(cellAlign, align)
      ? align
      : cellType === 'Label'
      ? 'right'
      : 'left',
    visible: getProperty('visible')?.toLowerCase() !== 'false',
    ...parsedCell({ cell: cellNode, model, getProperty }),
    // This mag get filled out in postProcessRows or parseFormTableDefinition
    ariaLabel: undefined,
  };
}
