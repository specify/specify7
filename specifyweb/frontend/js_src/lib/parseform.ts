/**
 * Converts XML form and formTable definitions to JSON, while also
 * adding type safety and strictness to help resolve ambiguities
 */

import { ajax, Http } from './ajax';
import { f } from './functools';
import { getParsedAttribute } from './helpers';
import { cachableUrl } from './initialcontext';
import type { CellTypes, FormCellDefinition } from './parseformcells';
import { parseFormCell, processColumnDefinition } from './parseformcells';
import { formatUrl } from './querystring';
import { getPref } from './remoteprefs';
import { parseClassName } from './resource';
import { getModel } from './schema';
import type { SpecifyModel } from './specifymodel';
import type { IR, R, RA } from './types';
import { defined, filterArray } from './types';

const getColumnDefinitions = (viewDefinition: Element): string =>
  defined(
    (
      viewDefinition.querySelector(
        `columnDef[os="${getPref('form.definition.columnSource')}"]`
      ) ?? viewDefinition.querySelector('columnDef')
    )?.textContent ?? getParsedAttribute(viewDefinition, 'colDef')
  );

export type ParsedFormDefinition = {
  // Define column sizes: either a number of pixels, or undefined for auto sizing
  readonly columns: RA<number | undefined>;
  // A two-dimensional grid of cells
  readonly rows: RA<RA<FormCellDefinition>>;
};

function parseFormTableDefinition(
  viewDefinition: Element,
  model: SpecifyModel | undefined
): ParsedFormDefinition {
  const { rows } = parseFormDefinition(viewDefinition, model);
  const labelsForCells = Object.fromEntries(
    filterArray(
      rows
        .flat()
        .map((cell) =>
          cell.type === 'Label' && typeof cell.labelForCellId === 'string'
            ? [cell.labelForCellId, cell]
            : undefined
        )
    )
  );
  const row = rows
    .flat()
    // FormTable consists of Fields and SubViews only
    .filter(({ type }) => type === 'Field' || type === 'SubView')
    .map((cell) => ({
      ...cell,
      // Make sure SubViews are rendered as buttons
      ...(cell.type === 'SubView' ? { isButton: true } : {}),
      // Set ariaLabel for all cells (would be used in formTable headers)
      ariaLabel:
        cell.ariaLabel ??
        (cell.type === 'Field' && cell.fieldDefinition.type === 'Checkbox'
          ? cell.fieldDefinition.label
          : undefined) ??
        labelsForCells[cell.id ?? '']?.text ??
        (cell.type === 'Field' || cell.type === 'SubView'
          ? model?.getField(cell.fieldName ?? '')?.label ?? cell.fieldName
          : undefined) ??
        cell.id,
      // Remove labels from checkboxes (as labels would be in the table header)
      ...(cell.type === 'Field' && cell.fieldDefinition.type === 'Checkbox'
        ? { fieldDefinition: { ...cell.fieldDefinition, label: undefined } }
        : {}),
    }));
  return {
    columns: Array.from({
      length: f.sum(row.map(({ colSpan }) => colSpan)),
    }).fill(undefined),
    rows: [row],
  };
}

export const parseFormDefinition = (
  viewDefinition: Element,
  model: SpecifyModel | undefined
): ParsedFormDefinition =>
  postProcessRows(
    processColumnDefinition(getColumnDefinitions(viewDefinition)),
    Array.from(viewDefinition.querySelectorAll(':scope > rows > row'), (row) =>
      Array.from(
        row.querySelectorAll(':scope > cell'),
        parseFormCell.bind(undefined, model)
      )
    ),
    model
  );

/**
 * Unfortunately, not all cell definitions can be parsed by looking at just
 * one cell at a time.
 * This method looks over all grid cells holistically and finishes parsing
 * them or fixes discovered issues.
 */
function postProcessRows(
  columns: RA<number | undefined>,
  rows: RA<RA<FormCellDefinition>>,
  model: SpecifyModel | undefined
): ParsedFormDefinition {
  // Index fieldNames and labelOverride for all cells by cellId
  const fieldsById: IR<{
    readonly fieldName: string | undefined;
    readonly labelOverride: string | undefined;
    // An alternative label to use, only if label is missing
    readonly altLabel: string | undefined;
  }> = Object.fromEntries(
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
            typeof cell.id === 'string' && cell.type === 'Field'
              ? [
                  cell.id,
                  {
                    fieldName: cell.fieldName,
                    // Checkbox definition can contain a label
                    labelOverride:
                      cell.fieldDefinition.type === 'Checkbox'
                        ? cell.fieldDefinition.label
                        : undefined,
                    /*
                     * Default Accession view doesn't have a label for
                     * Division ComboBox for some reason
                     */
                    altLabel:
                      cell.fieldName === 'divisionCBX'
                        ? model?.getField('division')?.label
                        : undefined,
                  },
                ]
              : undefined
          )
      )
    )
  );
  const initialLabelsForCells = Object.fromEntries(
    filterArray(
      rows
        .flat()
        .map((cell) =>
          cell.type === 'Label' && typeof cell.labelForCellId === 'string'
            ? [cell.labelForCellId, cell]
            : undefined
        )
    )
  );
  // If some row has extra columns, add new columns to the definition
  const newColumns = [
    ...columns,
    ...Array.from({
      length:
        Math.max(
          ...rows.map((row) => f.sum(row.map(({ colSpan }) => colSpan ?? 1)))
        ) - columns.length,
    }).fill(undefined),
  ];
  const newRows = rows.map<RA<FormCellDefinition>>((row, rowIndex) => {
    const totalColumns = f.sum(row.map(({ colSpan }) => colSpan ?? 1));
    return filterArray([
      ...row
        .map((cell, index) =>
          /*
           * If a Label without a labelForCellId attribute precedes a field with an
           * ID, but no label, associate the label with that field
           */
          cell.type === 'Label' && typeof cell.labelForCellId === 'undefined'
            ? typeof row[index + 1]?.id === 'string' &&
              // Don't do this for plugins, as they may already have a label
              f.var(
                row[index + 1],
                (cell) =>
                  cell.type !== 'Field' ||
                  cell.fieldDefinition.type !== 'Plugin'
              ) &&
              typeof initialLabelsForCells[defined(row[index + 1].id)] ===
                'undefined'
              ? {
                  // Assocate label with a field that follows it
                  ...cell,
                  labelForCellId: row[index + 1].id,
                }
              : newColumns.length === 1 &&
                typeof row[rowIndex + 1]?.id === 'string' &&
                typeof initialLabelsForCells[defined(row[rowIndex + 1].id)] ===
                  'undefined'
              ? {
                  /*
                   * Similar, but associate label with cell in next row, if
                   * there is only one column
                   */
                  ...cell,
                  labelForCellId: row[rowIndex + 1].id,
                }
              : cell
            : cell
        )
        .map((cell) =>
          cell.type === 'Label'
            ? {
                ...cell,
                ...(typeof cell.labelForCellId === 'string'
                  ? {
                      // Let some fields overwrite their label
                      text:
                        fieldsById[cell.labelForCellId]?.labelOverride ??
                        cell.text ??
                        fieldsById[cell.labelForCellId]?.altLabel,
                      // Get label fieldName from its field
                      fieldName: fieldsById[cell.labelForCellId]?.fieldName,
                    }
                  : {}),
                // Don't right align labels if there is only one column
                align: newColumns.length === 1 ? 'left' : cell.align,
              }
            : cell
        )
        .map((cell) =>
          cell.type === 'Label' && typeof model === 'object'
            ? f.var(model.getField(cell.fieldName ?? ''), (field) => ({
                ...cell,
                text:
                  cell.text ??
                  field?.label ??
                  /*
                   * Default Accession view doesn't have a label for
                   * Division ComboBox for some reason
                   */
                  (cell.id === 'divLabel'
                    ? model.getField('division')?.label
                    : undefined) ??
                  (cell.fieldName?.toLowerCase() === 'this'
                    ? undefined
                    : cell.fieldName) ??
                  '',
                title: field?.getLocalizedDesc(),
              }))
            : cell
        ),
      /*
       * Add a necessary number of blank cells at the end so that the
       * grid is not off when some row has fewer columns than in the definition.
       */
      newColumns.length - totalColumns > 0
        ? {
            type: 'Blank',
            id: undefined,
            align: 'left',
            colSpan: newColumns.length - totalColumns,
            visible: false,
            ariaLabel: undefined,
          }
        : undefined,
    ]);
  });
  const labelsForCells = Object.fromEntries(
    filterArray(
      newRows
        .flat()
        .map((cell) =>
          cell.type === 'Label' && typeof cell.labelForCellId === 'string'
            ? [cell.labelForCellId, cell]
            : undefined
        )
    )
  );
  return {
    columns: newColumns,
    rows: newRows.map((row) =>
      row.map((cell) =>
        typeof cell.id === 'undefined' ||
        typeof labelsForCells[cell.id] === 'object'
          ? cell.type === 'Field' && cell.fieldDefinition.type === 'Checkbox'
            ? {
                ...cell,
                /*
                 * Remove label from the checkbox field, if it already has an
                 * associated label
                 */
                label: undefined,
              }
            : cell
          : {
              ...cell,
              ...(cell.type === 'Field' &&
              cell.fieldDefinition.type === 'Checkbox'
                ? {
                    fieldDefinition: {
                      ...cell.fieldDefinition,
                      /*
                       * If checkbox does not have a label in a separate cell,
                       * Get its label from the fieldName
                       */
                      label:
                        cell.fieldDefinition.label ??
                        model?.getField(cell.fieldName ?? '')?.label ??
                        cell.ariaLabel,
                    },
                  }
                : {}),
              // If cell has a fieldName, but no associated label, set ariaLabel
              ariaLabel:
                // Don't add aria-label to checkboxes as they would already have a label
                cell.type === 'Field' &&
                cell.fieldDefinition.type === 'Checkbox'
                  ? undefined
                  : cell.ariaLabel ??
                    (cell.type === 'Field' || cell.type === 'SubView'
                      ? model?.getField(cell.fieldName ?? '')?.label
                      : undefined),
            }
      )
    ),
  };
}

export function processViewDefinition(
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
    return (
      getParsedAttribute(viewDefinition, 'type')?.toLowerCase() ===
      formType.toLowerCase()
    );
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

  const newFormType = getParsedAttribute(viewDefinition, 'type');
  return {
    viewDefinition: actualViewDefinition,
    formType:
      formTypes.find(
        (type) => type.toLowerCase() === newFormType?.toLowerCase()
      ) ?? 'form',
    mode: mode === 'search' ? mode : altView.mode,
    model: defined(
      getModel(
        f.var(
          parseClassName(
            defined(getParsedAttribute(actualViewDefinition, 'class'))
          ),
          (modelName) =>
            modelName === 'ObjectAttachmentIFace' ? 'Attachment' : modelName
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

const views: R<ViewDefinition | undefined> = {};
export const getView = async (
  name: string
): Promise<ViewDefinition | undefined> =>
  name in views
    ? Promise.resolve(views[name])
    : ajax<ViewDefinition>(
        /*
         * NOTE: If getView hasn't yet been invoked, the view URLs won't be
         * marked as cachable
         */
        cachableUrl(formatUrl('/context/view.json', { name })),
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'application/json' },
        },
        {
          expectedResponseCodes: [Http.OK, Http.NOT_FOUND],
        }
      ).then(({ data, status }) => {
        views[name] = status === Http.NOT_FOUND ? undefined : data;
        return views[name];
      });

export const formTypes = ['form', 'formTable'] as const;
export type FormType = typeof formTypes[number];
export type FormMode = 'edit' | 'view' | 'search';
