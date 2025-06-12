/**
 * Parse form cell XML into a JSON structure
 *
 * Documentation - https://github.com/specify/specify7/wiki/Form-System#cell-definition
 * On any modifications, please check if documentation needs to be updated.
 */

import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { f } from '../../utils/functools';
import type { IR, RA, ValueOf } from '../../utils/types';
import { backboneFieldSeparator } from '../DataModel/helpers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import {
  addContext,
  getLogContext,
  pushContext,
  setLogContext,
} from '../Errors/logContext';
import { parseSpecifyProperties } from '../FormEditor/viewSpec';
import { legacyLocalize } from '../InitialContext/legacyUiLocalization';
import { toLargeSortConfig } from '../Molecules/Sorting';
import { hasPathPermission } from '../Permissions/helpers';
import type { SimpleXmlNode } from '../Syncer/xmlToJson';
import {
  getAttribute,
  getBooleanAttribute,
  getParsedAttribute,
} from '../Syncer/xmlUtils';
import type { CommandDefinition } from './commands';
import { parseUiCommand } from './commands';
import type { FormFieldDefinition } from './fields';
import { parseFormField } from './fields';
import type { ConditionalFormDefinition, FormType } from './index';
import { fetchView, parseFormDefinition } from './index';

/** Parse column width definitions */
export const processColumnDefinition = (
  columnDefinition: string
): RA<number | undefined> =>
  (columnDefinition.endsWith(',p:g')
    ? columnDefinition.slice(0, -1 * ',p:g'.length)
    : columnDefinition
  )
    .split(',')
    .filter((_, index) => index % 2 === 0)
    .map((definition) => /(\d+)px/u.exec(definition)?.[1] ?? '')
    .map(f.parseInt);

export type CellTypes = {
  readonly Field: State<
    'Field',
    {
      readonly fieldNames: RA<string> | undefined;
      readonly fieldDefinition: FormFieldDefinition;
      readonly isRequired: boolean;
    }
  >;
  readonly Label: State<
    'Label',
    {
      readonly text: LocalizedString | undefined;
      readonly title: LocalizedString | undefined;
      readonly labelForCellId: string | undefined;
      readonly fieldNames: RA<string> | undefined;
    }
  >;
  readonly Separator: State<
    'Separator',
    {
      readonly label: LocalizedString | undefined;
      readonly icon: string | undefined;
      readonly forClass: keyof Tables | undefined;
    }
  >;
  readonly SubView: State<
    'SubView',
    {
      readonly fieldNames: RA<string> | undefined;
      readonly formType: FormType;
      readonly isButton: boolean;
      readonly icon: string | undefined;
      readonly viewName: string | undefined;
      readonly sortField: SubViewSortField | undefined;
      readonly isCollapsed?: boolean;
    }
  >;
  readonly Panel: State<
    'Panel',
    {
      readonly display: 'block' | 'inline';
      readonly definitions: ConditionalFormDefinition;
    }
  >;
  readonly Command: State<
    'Command',
    {
      readonly commandDefinition: CommandDefinition;
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

export type SubViewSortField = {
  readonly direction: 'asc' | 'desc';
  readonly fieldNames: RA<string>;
};

export const cellAlign = ['left', 'center', 'right'] as const;
export const cellVerticalAlign = ['stretch', 'center', 'start', 'end'] as const;

const processCellType: {
  readonly [KEY in keyof CellTypes]: (props: {
    readonly cell: SimpleXmlNode;
    readonly table: SpecifyTable;
    readonly getProperty: (name: string) => string | undefined;
  }) => Promise<CellTypes[KEY | 'Blank']>;
} = {
  async Field({ cell, table, getProperty }) {
    const rawFieldName = getParsedAttribute(cell, 'name');
    const fields = table?.getFields(rawFieldName ?? '');
    const fieldNames = fields?.map(({ name }) => name);
    const fieldsString = fieldNames?.join(backboneFieldSeparator);

    addContext({ field: fieldsString ?? rawFieldName });

    const fieldDefinition = parseFormField({
      cell,
      getProperty,
      table,
      fields,
    });

    /*
     * Some plugins overwrite the fieldName. In such cases, the [name] attribute
     * is commonly "this"
     */
    const resolvedFields =
      (fieldDefinition.type === 'Plugin' &&
      fieldDefinition.pluginDefinition.type === 'PartialDateUI'
        ? table.getFields(
            fieldDefinition.pluginDefinition.dateFields.join(
              backboneFieldSeparator
            )
          )
        : undefined) ?? fields;

    if (
      resolvedFields === undefined &&
      (fieldDefinition.type !== 'Plugin' ||
        fieldDefinition.pluginDefinition.type === 'PartialDateUI')
    )
      console.error(`Unknown field: ${rawFieldName ?? '(null)'}`);

    const hasAccess =
      resolvedFields === undefined || hasPathPermission(resolvedFields, 'read');

    return hasAccess && fieldDefinition.type !== 'Blank'
      ? {
          type: 'Field',
          fieldNames: resolvedFields?.map(({ name }) => name),
          fieldDefinition,
          isRequired:
            (getBooleanAttribute(cell, 'isRequired') ?? false) ||
            (fields?.at(-1)?.localization.isrequired ?? false),
        }
      : { type: 'Blank' };
  },
  Label: async ({ cell }) => ({
    type: 'Label',
    // This may be overwritten in postProcessRows
    text: f.maybe(getParsedAttribute(cell, 'label'), legacyLocalize),
    // This would be set in postProcessRows
    title: undefined,
    labelForCellId: getParsedAttribute(cell, 'labelFor'),
    // This would be set in postProcessRows
    fieldNames: undefined,
  }),
  Separator: async ({ cell }) => ({
    type: 'Separator',
    label: f.maybe(getParsedAttribute(cell, 'label'), legacyLocalize),
    icon: getParsedAttribute(cell, 'icon'),
    forClass: f.maybe(
      getParsedAttribute(cell, 'forClass'),
      (forClass) => getTable(forClass)?.name
    ),
  }),
  async SubView({ cell, table, getProperty }) {
    const rawFieldName = getParsedAttribute(cell, 'name');
    const fields = table.getFields(rawFieldName ?? '');
    if (fields === undefined) {
      console.error(
        `Unknown field ${rawFieldName ?? '(null)'} when parsing form SubView`,
        {
          cell,
          table,
        }
      );
      return { type: 'Blank' };
    }
    const relationship = fields.at(-1);
    if (relationship?.isRelationship === false) {
      console.error('SubView can only be used to display a relationship');
      return { type: 'Blank' };
    } else if (fields.at(-1)?.type === 'many-to-many') {
      // ResourceApi does not support .rget() on a many-to-many
      console.error('Many-to-many relationships are not supported');
      return { type: 'Blank' };
    }

    const hasAccess = hasPathPermission(fields, 'read');
    if (!hasAccess) return { type: 'Blank' };

    const rawSortField = getProperty('sortField');
    const parsedSort = f.maybe(rawSortField, toLargeSortConfig);
    const sortFields = relationship!.relatedTable.getFields(
      parsedSort?.fieldNames.join(backboneFieldSeparator) ?? ''
    );

    const viewName = getParsedAttribute(cell, 'viewName');

    const rawFormType = getParsedAttribute(cell, 'defaultType')?.toLowerCase();

    const defaultFormType =
      viewName === undefined
        ? viewName
        : await fetchView(viewName).then(
            (view) => view?.defaultSubviewFormType
          );

    const formType =
      rawFormType === undefined
        ? (defaultFormType ?? 'form')
        : rawFormType === 'table'
          ? 'formTable'
          : 'form';

    return {
      type: 'SubView',
      formType,
      fieldNames: fields?.map(({ name }) => name),
      viewName,
      isButton: getProperty('btn')?.toLowerCase() === 'true',
      icon: getProperty('icon'),
      sortField:
        sortFields === undefined
          ? undefined
          : {
              direction: parsedSort?.direction ?? 'asc',
              fieldNames: sortFields.map(({ name }) => name),
            },
      isCollapsed: getProperty('collapse')?.toLowerCase() === 'true',
    };
  },
  Panel: async ({ cell, table }) => {
    const oldContext = getLogContext();
    pushContext({ type: 'Child', tagName: 'Panel' });
    const definitions = await parseFormDefinition(cell, table);
    setLogContext(oldContext);

    return {
      type: 'Panel',
      definitions,
      display:
        getParsedAttribute(cell, 'panelType')?.toLowerCase() === 'buttonbar'
          ? 'inline'
          : 'block',
    };
  },
  Command: async ({ cell, table }) => ({
    type: 'Command',
    commandDefinition: parseUiCommand(cell, table),
  }),
  /**
   * This function never actually gets called
   * Blank cell type is used by postProcessRows if row definition has fewer
   * cells than defined columns
   */
  Blank: async () => ({ type: 'Blank' }),
  Unsupported: async ({ cell }) => {
    console.warn(
      `Unsupported cell type: ${getParsedAttribute(cell, 'type') ?? '(null)'}`
    );
    return {
      type: 'Unsupported',
      cellType: getAttribute(cell, 'type'),
    };
  },
};

export type FormCellDefinition = ValueOf<CellTypes> & {
  readonly id: string | undefined;
  readonly align: (typeof cellAlign)[number];
  readonly colSpan: number;
  readonly visible: boolean;
  readonly ariaLabel: LocalizedString | undefined;
  readonly verticalAlign: (typeof cellVerticalAlign)[number];
};

const cellTypeTranslation: IR<keyof CellTypes> = {
  field: 'Field',
  label: 'Label',
  separator: 'Separator',
  subview: 'SubView',
  panel: 'Panel',
  command: 'Command',
  blank: 'Blank',
};

/**
 * Parse form cell XML into a JSON structure
 *
 * Does not depend on FormMode, FormType
 */
export async function parseFormCell(
  table: SpecifyTable,
  cellNode: SimpleXmlNode
): Promise<FormCellDefinition> {
  const cellClass = getParsedAttribute(cellNode, 'type') ?? '';
  const cellType = cellTypeTranslation[cellClass.toLowerCase()];

  /*
   * FEATURE: warn on IDs that include spaces and other unsupported characters.
   *   See https://github.com/specify/specify7/issues/2871
   */
  const id = getParsedAttribute(cellNode, 'id');
  addContext({ id, type: cellType });

  const parsedCell = processCellType[cellType] ?? processCellType.Unsupported;
  const properties = parseSpecifyProperties(
    getAttribute(cellNode, 'initialize') ?? ''
  );
  const getProperty = (name: string): string | undefined =>
    properties[name.toLowerCase()];
  const align = getProperty('align')?.toLowerCase();
  const colSpan = f.parseInt(getParsedAttribute(cellNode, 'colSpan'));
  const verticalAlign = getProperty('verticalAlign')?.toLowerCase();

  return {
    id,
    colSpan: typeof colSpan === 'number' ? Math.ceil(colSpan / 2) : 1,
    align: f.includes(cellAlign, align)
      ? align
      : cellType === 'Label'
        ? 'right'
        : 'left',
    verticalAlign: f.includes(cellVerticalAlign, verticalAlign)
      ? verticalAlign
      : cellType === 'SubView'
        ? 'stretch'
        : 'center',
    /*
     * Specify 6 has `initialize="visible=false"` and
     * `initialize="vis=false"` attributes for some cell definitions.
     * vis=false doesn't seem to be implemented at all. visible=false seems to
     * be implemented for buttons and panels only, but from tests we did, it
     * does not seem to work either.
     * Specify 7.6.1 and prior ignored both of these attributes.
     * Specify 7.7.0 was going to respect visible=false for all cell types,
     * but it ran into problem: "Generate Label on Save" checkbox and
     * "Generate Label" buttons on the default Collection Object form have
     * visible=false. Adding support for that attribute in Specify 7 would mean
     * this checkbox and button would disappear from forms in Specify 7 when
     * users update to 7.7.0.
     * To mitigate the above issues, Specify 7 form definitions are using
     * "invisible=true" instead of "visible=false" for making fields invisible
     */
    visible:
      getBooleanAttribute(cellNode, 'invisible') !== true ||
      parsedCell === processCellType.Unsupported,
    ...(await parsedCell({ cell: cellNode, table, getProperty })),
    // This may get filled out in postProcessRows or parseFormTableDefinition
    ariaLabel: undefined,
  };
}
