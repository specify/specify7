/**
 * Converts XML form and formTable definitions to JSON, while also
 * adding type safety and strictness to help resolve ambiguities
 */

import { ajax, Http } from './ajax';
import type { CellTypes, FormCellDefinition } from './parseformcells';
import {
  getAttribute,
  parseFormCell,
  processColumnDefinition,
} from './parseformcells';
import * as queryString from './querystring';
import { getModel } from './schema';
import { SpecifyModel } from './specifymodel';
import type { IR, R, RA } from './types';
import { defined, filterArray } from './types';
import { f } from './wbplanviewhelper';

const columnDefinitionsPlatform = 'lnx';
const getColumnDefinitions = (viewDefinition: Element): string =>
  defined(
    viewDefinition.querySelector(
      `columnDef[os="${columnDefinitionsPlatform}"], columnDef`
    )?.textContent ?? getAttribute(viewDefinition, 'colDef')
  );

export type ParsedFormDefinition = {
  // Define column sizes: either a number of pixels, or undefined for auto sizing
  readonly columns: RA<number | undefined>;
  // Two dimensional grid of cells
  readonly rows: RA<RA<FormCellDefinition>>;
};

function parseFormTableDefinition(
  viewDefinition: Element,
  model: SpecifyModel | undefined
): ParsedFormDefinition {
  const cells = Array.from(
    viewDefinition.querySelectorAll('cell[type="field"], cell[type="subview"]'),
    parseFormCell.bind(undefined, model)
  );
  return postProcessRows(cells.map(f.undefined), [cells]);
}

export const parseFormDefinition = (
  viewDefinition: Element,
  model: SpecifyModel | undefined
): ParsedFormDefinition =>
  postProcessRows(
    processColumnDefinition(getColumnDefinitions(viewDefinition)),
    Array.from(viewDefinition.querySelectorAll('rows > row'), (row) =>
      Array.from(
        row.querySelectorAll('cell'),
        parseFormCell.bind(undefined, model)
      )
    )
  );

// TODO: if field has no label, add aria-label
function postProcessRows(
  columns: RA<number | undefined>,
  rows: RA<RA<FormCellDefinition>>
): ParsedFormDefinition {
  const fieldsById: IR<
    | {
        readonly fieldName: string | undefined;
        readonly labelOverride: string | undefined;
      }
    | undefined
  > = Object.fromEntries(
    filterArray(
      rows.flatMap((row) =>
        row
          .filter(
            (
              cell
            ): cell is FormCellDefinition &
              CellTypes['Field'] & { readonly id: string } =>
              cell.type === 'Field' && typeof cell.id === 'string'
          )
          .map((cell) =>
            typeof cell.id === 'string'
              ? [
                  cell.id,
                  cell.type === 'Field'
                    ? {
                        // Some plugins may override the fieldName
                        fieldName:
                          (cell.fieldDefinition.type === 'Plugin'
                            ? cell.fieldDefinition.pluginDefinition.type ===
                              'PartialDateUI'
                              ? cell.fieldDefinition.pluginDefinition.dateField
                              : cell.fieldDefinition.pluginDefinition.type ===
                                  'CollectionRelOneToManyPlugin' ||
                                cell.fieldDefinition.pluginDefinition.type ===
                                  'ColRelTypePlugin'
                              ? cell.fieldDefinition.pluginDefinition
                                  .relationship
                              : undefined
                            : undefined) ?? cell.fieldName,
                        // Checkbox definition can contain a label
                        labelOverride:
                          cell.fieldDefinition.type === 'Checkbox'
                            ? cell.fieldDefinition.label
                            : undefined,
                      }
                    : undefined,
                ]
              : undefined
          )
      )
    )
  );
  return {
    columns,
    rows: rows.map((row, index) => {
      const totalColumns = f.sum(row.map(({ colSpan }) => colSpan ?? 1));
      if (totalColumns > columns.length)
        console.error(
          `Row ${index}/${rows.length} has ${totalColumns} column(s), when
          expected only ${columns.length}`,
          { row, columns }
        );
      return filterArray([
        ...row
          /*
           * Make sure total colSpan is not larger than the number of columns
           * as that would mess up the grid
           */
          .reduce<{ readonly cells: typeof row; readonly remaining: number }>(
            ({ cells, remaining }, cell) => ({
              cells:
                remaining < 0
                  ? cells
                  : [
                      ...cells,
                      {
                        ...cell,
                        colSpan: Math.min(remaining, cell.colSpan),
                      },
                    ],
              remaining: remaining - (cell.colSpan ?? 1),
            }),
            { cells: [], remaining: columns.length }
          )
          .cells.map((cell, index) =>
            /*
             * If a Label without a labelForCellId attribute precedes a field with an
             * ID, but no label, associate the label with that field
             */
            cell.type === 'Label' &&
            typeof cell.labelForCellId === 'undefined' &&
            typeof row[index + 1]?.id === 'number' &&
            rows.every((row) =>
              row.every(
                (cell) =>
                  cell.type !== 'Label' ||
                  cell.labelForCellId !== row[index + 1].id
              )
            )
              ? {
                  ...cell,
                  labelForCellId: row[index + 1].id,
                }
              : cell
          )
          .map((cell) =>
            cell.type === 'Label' && typeof cell.labelForCellId === 'string'
              ? {
                  ...cell,
                  // Let some fields overwrite their label
                  text:
                    fieldsById[cell.labelForCellId]?.labelOverride ?? cell.text,
                  // Get label fieldName from its field
                  fieldName: fieldsById[cell.labelForCellId]?.fieldName,
                }
              : cell
          ),
        columns.length - totalColumns > 0
          ? {
              type: 'Blank',
              id: undefined,
              align: 'left',
              colSpan: columns.length - row.length,
              visible: false,
            }
          : undefined,
      ]);
    }),
  };
}

function processViewDefinition(
  view: ViewDefinition,
  formType: FormType,
  mode: FormMode
): {
  readonly viewDefinition: Element;
  readonly formType: FormType;
  readonly mode: FormMode;
  readonly model: SpecifyModel;
} {
  let altViews: RA<AltView> = Object.values(view.altviews).filter(
    (altView) => altView.mode === mode
  );
  if (altViews.length === 0) altViews = Object.values(view.altviews);

  const viewDefinitions = Object.fromEntries(
    Object.entries(view.viewdefs).map(([name, xml]) => [
      name,
      new window.DOMParser()
        .parseFromString(xml, 'text/xml')
        .getElementsByTagName('viewdef')[0],
    ])
  );

  let viewDefinition;
  let altView = altViews.find((altView) => {
    viewDefinition = viewDefinitions[altView.viewdef];
    return getAttribute(viewDefinition, 'type') === formType;
  });
  if (typeof altView === 'undefined' || typeof viewDefinition === 'undefined') {
    console.error('No altView for defaultType:', formType);
    altView = altViews[0];
    viewDefinition = viewDefinitions[altView.viewdef];
  }

  const definition =
    viewDefinition.getElementsByTagName('definition')[0]?.textContent;
  const actualViewDefinition =
    typeof definition === 'string'
      ? viewDefinitions[definition]
      : viewDefinition;

  const newFormType = getAttribute(viewDefinition, 'type');
  return {
    viewDefinition: actualViewDefinition,
    formType:
      formTypes.find(
        (type) => type.toLowerCase() === newFormType?.toLowerCase()
      ) ?? 'form',
    mode: altView.mode,
    model: defined(
      getModel(
        SpecifyModel.parseClassName(
          defined(getAttribute(actualViewDefinition, 'class'))
        )
      )
    ),
  };
}

export type ViewDescription = ParsedFormDefinition & {
  readonly formType: FormType;
  readonly mode: FormMode;
  readonly model: SpecifyModel | undefined;
};

export function parseViewDefinition(
  view: ViewDefinition,
  defaultType: FormType,
  originalMode: FormMode
): ViewDescription {
  const { mode, formType, viewDefinition, model } = processViewDefinition(
    view,
    defaultType,
    originalMode
  );
  const parser =
    formType === 'formTable' ? parseFormTableDefinition : parseFormDefinition;
  return {
    mode,
    formType,
    model,
    ...parser(viewDefinition, model),
  };
}

type AltView = {
  readonly default: 'true' | 'false';
  readonly mode: FormMode;
  readonly name: string;
  readonly viewdef: string;
};

export type ViewDefinition = {
  readonly altviews: IR<AltView>;
  readonly busrules: string;
  readonly class: string;
  readonly name: string;
  readonly resourcelabels: 'true' | 'false';
  readonly viewdefs: IR<string>;
  readonly viewsetLevel: string;
  readonly viewsetName: string;
  readonly viewsetSource: string;
};

const views: R<ViewDefinition> = {};
export const getView = async (name: string): Promise<ViewDefinition> =>
  name in views
    ? Promise.resolve(views[name])
    : ajax<ViewDefinition>(
        queryString.format('/context/view.json', { name }),
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'application/json' },
        },
        {
          expectedResponseCodes: [Http.OK, Http.NOT_FOUND],
        }
      ).then(({ data, status }) => {
        if (status === Http.NOT_FOUND) throw new Error('Form not found');
        views[name] = data;
        return data;
      });

export const formTypes = ['form', 'formTable'];
export type FormType = typeof formTypes[number];
export type FormMode = 'edit' | 'view' | 'search';
