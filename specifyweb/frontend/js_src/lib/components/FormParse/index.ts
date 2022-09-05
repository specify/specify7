/**
 * Converts XML form and formTable definitions to JSON, while also
 * adding type safety and strictness to help resolve ambiguities
 */

import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/helpers';
import { f } from '../../utils/functools';
import type { IR, R, RA } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { getParsedAttribute } from '../../utils/utils';
import { parseXml } from '../AppResources/codeMirrorLinters';
import { parseClassName } from '../DataModel/resource';
import { strictGetModel } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { error } from '../Errors/assert';
import { cachableUrl } from '../InitialContext';
import { getPref } from '../InitialContext/remotePrefs';
import { formatUrl } from '../Router/queryString';
import type { FormCellDefinition } from './cells';
import { parseFormCell, processColumnDefinition } from './cells';
import { postProcessFormDef } from './postProcessFormDef';

function getColumnDefinitions(viewDefinition: Element): string {
  const definition =
    getColumnDefinition(
      viewDefinition,
      getPref('form.definition.columnSource')
    ) ?? getColumnDefinition(viewDefinition, undefined);
  return defined(
    definition ?? getParsedAttribute(viewDefinition, 'colDef'),
    'Form definition does not contain column definition'
  );
}

const getColumnDefinition = (
  viewDefinition: Element,
  os: string | undefined
): string | undefined =>
  viewDefinition.querySelector(
    `columnDef${typeof os === 'string' ? `[os="${os}"]` : ''}`
  )?.textContent ?? undefined;

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
      // Center all fields in each column
      align: 'center' as const,
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
          : undefined),
      // Remove labels from checkboxes (as labels would be in the table header)
      ...(cell.type === 'Field' && cell.fieldDefinition.type === 'Checkbox'
        ? { fieldDefinition: { ...cell.fieldDefinition, label: undefined } }
        : {}),
    }));

  return {
    columns: parseFormTableColumns(viewDefinition, row),
    rows: [row],
  };
}

function parseFormTableColumns(
  viewDefinition: Element,
  row: RA<FormCellDefinition>
): RA<number | undefined> {
  const columnCount = f.sum(row.map(({ colSpan }) => colSpan));
  const rawColumnDefinition = f.maybe(
    getColumnDefinition(viewDefinition, 'table'),
    processColumnDefinition
  );
  const columnDefinition =
    typeof rawColumnDefinition === 'object'
      ? [
          ...rawColumnDefinition,
          ...Array.from({
            length: columnCount - rawColumnDefinition.length,
          }).fill(undefined),
        ]
      : undefined;
  return (
    columnDefinition ??
    Array.from({
      length: columnCount,
    }).fill(undefined)
  );
}

export const parseFormDefinition = (
  viewDefinition: Element,
  model: SpecifyModel | undefined
): ParsedFormDefinition =>
  postProcessFormDef(
    processColumnDefinition(getColumnDefinitions(viewDefinition)),
    Array.from(viewDefinition.querySelectorAll(':scope > rows > row'), (row) =>
      Array.from(
        row.querySelectorAll(':scope > cell'),
        parseFormCell.bind(undefined, model)
      )
    ),
    model
  );

export function processViewDefinition(
  view: ViewDefinition,
  formType: FormType,
  mode: FormMode
):
  | {
      readonly viewDefinition: Element;
      readonly formType: FormType;
      readonly mode: FormMode;
      readonly model: SpecifyModel;
    }
  | undefined {
  let altViews: RA<AltView> = Object.values(view.altviews).filter(
    (altView) => altView.mode === mode
  );
  if (altViews.length === 0) altViews = Object.values(view.altviews);

  const viewDefinitions = Object.fromEntries(
    Object.entries(view.viewdefs).map(([name, xml]) => {
      const parsed = parseXml(xml);
      if (typeof parsed === 'string')
        error(`Failed parsing XML for view definition`, {
          error: parsed,
          xml,
        });
      return [name, parsed.getElementsByTagName('viewdef')[0]];
    })
  );

  let viewDefinition;
  let altView = altViews.find((altView) => {
    viewDefinition = viewDefinitions[altView.viewdef];
    return (
      typeof viewDefinition === 'object' &&
      // BUG: this checks for "formTable". should it check for "table" instead?
      getParsedAttribute(viewDefinition, 'type')?.toLowerCase() ===
        formType.toLowerCase()
    );
  });
  if (altView === undefined || viewDefinition === undefined) {
    console.error('No altView for defaultType:', formType);
    altView = altViews[0];
    viewDefinition = viewDefinitions[altView.viewdef];
  }

  const definition =
    viewDefinition?.getElementsByTagName('definition')[0]?.textContent;
  const actualViewDefinition =
    typeof definition === 'string'
      ? viewDefinitions[definition]
      : viewDefinition;

  if (actualViewDefinition === undefined) return undefined;

  const newFormType = getParsedAttribute(viewDefinition, 'type');
  const modelName = parseClassName(
    defined(
      getParsedAttribute(actualViewDefinition, 'class'),
      'Form definition does not contain a class attribute'
    )
  );
  return {
    viewDefinition: actualViewDefinition,
    formType:
      formTypes.find(
        (type) => type.toLowerCase() === newFormType?.toLowerCase()
      ) ?? 'form',
    mode: mode === 'search' ? mode : altView.mode,
    model: strictGetModel(
      modelName === 'ObjectAttachmentIFace' ? 'Attachment' : modelName
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
): ViewDescription | undefined {
  const resolved = processViewDefinition(view, defaultType, originalMode);
  if (resolved === undefined) return undefined;
  const { mode, formType, viewDefinition, model } = resolved;
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
  readonly default: 'false' | 'true';
  readonly mode: FormMode;
  readonly name: string;
  readonly viewdef: string;
};

export type ViewDefinition = {
  readonly altviews: IR<AltView>;
  readonly busrules: string;
  readonly class: string;
  readonly name: string;
  readonly resourcelabels: 'false' | 'true';
  readonly viewdefs: IR<string>;
  readonly viewsetLevel: string;
  readonly viewsetName: string;
  readonly viewsetSource: string;
};

const views: R<ViewDefinition | undefined> = {};
export const fetchView = async (
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
export type FormMode = 'edit' | 'search' | 'view';
