/**
 * Converts XML form and formTable definitions to JSON, while also
 * adding type safety and strictness to help resolve ambiguities
 */

import { ajax, Http } from './ajax';
import type { CellTypes, FormCellDefinition } from './parseformcells';
import {
  parseFormCellDefinition,
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
      `columnDef[os="${columnDefinitionsPlatform}"], columnDef, colDef`
    ) ?? undefined
  ).textContent ?? '';

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
    parseFormCellDefinition.bind(undefined, model)
  );
  return {
    columns: cells.map(f.undefined),
    rows: postProcessRows([cells]),
  };
}

export const parseFormDefinition = (
  viewDefinition: Element,
  model: SpecifyModel | undefined
): ParsedFormDefinition => ({
  columns: processColumnDefinition(getColumnDefinitions(viewDefinition)),
  rows: postProcessRows(
    Array.from(viewDefinition.querySelectorAll('rows > row'), (row) =>
      Array.from(
        row.querySelectorAll('cell'),
        parseFormCellDefinition.bind(undefined, model)
      )
    )
  ),
});

function postProcessRows(
  rows: RA<RA<FormCellDefinition>>
): RA<RA<FormCellDefinition>> {
  const fields: IR<
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
                        // PartialDateUi may override the fieldName
                        fieldName:
                          cell.fieldName ??
                          (cell.fieldDefinition.type === 'Plugin' &&
                          cell.fieldDefinition.pluginDefinition.type ===
                            'PartialDateUI'
                            ? cell.fieldDefinition.pluginDefinition.dateField
                            : undefined),
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
  return rows.map((row) =>
    row.map((cell) =>
      cell.type === 'Label' && typeof cell.labelForCellId === 'string'
        ? {
            ...cell,
            text: fields[cell.labelForCellId]?.labelOverride ?? cell.text,
            fieldName: fields[cell.labelForCellId]?.labelOverride,
          }
        : cell
    )
  );
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
    return viewDefinition.getAttribute('type') === formType;
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

  const newFormType = viewDefinition.getAttribute('type');
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
          defined(actualViewDefinition.getAttribute('class') ?? undefined)
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

type ViewDefinition = {
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
