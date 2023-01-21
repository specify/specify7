/**
 * Converts XML form and formTable definitions to JSON, while also
 * adding type safety and strictness to help resolve ambiguities
 */

import type { LocalizedString } from 'typesafe-i18n';

import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { f } from '../../utils/functools';
import type { IR, R, RA } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { getParsedAttribute } from '../../utils/utils';
import { parseXml } from '../AppResources/codeMirrorLinters';
import { formatList } from '../Atoms/Internationalization';
import { parseJavaClassName } from '../DataModel/resource';
import { strictGetModel } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { error } from '../Errors/assert';
import type { LogMessage } from '../Errors/interceptLogs';
import { consoleLog, setLogContext } from '../Errors/interceptLogs';
import { cachableUrl } from '../InitialContext';
import { getPref } from '../InitialContext/remotePrefs';
import { formatUrl } from '../Router/queryString';
import type { FormCellDefinition } from './cells';
import { parseFormCell, processColumnDefinition } from './cells';
import { postProcessFormDef } from './postProcessFormDef';
import { webOnlyViews } from './webOnlyViews';
import { LiteralField, Relationship } from '../DataModel/specifyField';

export type ViewDescription = ParsedFormDefinition & {
  readonly formType: FormType;
  readonly mode: FormMode;
  readonly model: SpecifyModel;
  readonly errors?: RA<LogMessage>;
  readonly viewSetId?: number;
};

type AltView = {
  readonly default?: 'false' | 'true';
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
  readonly viewsetId: number | null;
};

export const formTypes = ['form', 'formTable'] as const;
export type FormType = typeof formTypes[number];
export type FormMode = 'edit' | 'search' | 'view';

const views: R<ViewDefinition | undefined> = {};
export const fetchView = async (
  name: string
): Promise<ViewDefinition | undefined> =>
  name in views
    ? Promise.resolve(views[name])
    : ajax(
        /*
         * NOTE: If getView hasn't yet been invoked, the view URLs won't be
         * marked as cachable
         */
        cachableUrl(
          formatUrl('/context/view.json', {
            name,
            // Don't spam the console with errors needlessly
            ...(name in webOnlyViews() ? { quiet: '' } : {}),
          })
        ),
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'text/plain' },
        },
        {
          expectedResponseCodes: [Http.OK, Http.NOT_FOUND, Http.NO_CONTENT],
        }
      ).then(({ data, status }) => {
        views[name] =
          status === Http.NOT_FOUND || status === Http.NO_CONTENT
            ? undefined
            : (JSON.parse(data) as ViewDefinition);
        if (status === Http.NOT_FOUND)
          console.error(
            `Unable to find a view definition for the "${name}" view`
          );
        return views[name];
      });

export function parseViewDefinition(
  view: ViewDefinition,
  defaultType: FormType,
  originalMode: FormMode
): ViewDescription | undefined {
  setLogContext({ viewName: view.name });
  const resolved = resolveViewDefinition(view, defaultType, originalMode);
  if (resolved === undefined) return undefined;
  const { mode, formType, viewDefinition, model } = resolved;
  const parser =
    formType === 'formTable'
      ? parseFormTableDefinition
      : (viewDefinition: Element, model: SpecifyModel) =>
          parseFormDefinition(viewDefinition, model)[0].definition;

  const logIndexBefore = consoleLog.length;
  const parsed = parser(viewDefinition, model);
  const errors = consoleLog.slice(logIndexBefore);
  setLogContext({}, false);

  return {
    mode,
    formType,
    model,
    viewSetId: view.viewsetId ?? undefined,
    errors,
    ...parsed,
  };
}

export function resolveViewDefinition(
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
  const viewDefinitions = parseViewDefinitions(view.viewdefs);
  if (Object.keys(viewDefinitions).length === 0) {
    console.error(`No view definitions found for the ${view.name} view`);
    return undefined;
  }

  const { altView, viewDefinition } = resolveAltView(
    view.altviews,
    viewDefinitions,
    formType,
    mode
  );

  const definition =
    viewDefinition?.getElementsByTagName('definition')[0]?.textContent;
  const actualViewDefinition =
    typeof definition === 'string'
      ? viewDefinitions[definition]
      : viewDefinition;

  if (actualViewDefinition === undefined) return undefined;

  const newFormType = getParsedAttribute(viewDefinition, 'type');
  const modelName = parseJavaClassName(
    defined(
      getParsedAttribute(actualViewDefinition, 'class'),
      'Form definition does not contain a class attribute'
    )
  );
  const resolvedFormType =
    formType === 'formTable'
      ? 'formTable'
      : formTypes.find(
          (type) => type.toLowerCase() === newFormType?.toLowerCase()
        );
  if (resolvedFormType === undefined)
    console.warn(
      `Unknown form type ${
        newFormType ?? '(null)'
      }. Expected one of ${formatList(formTypes)}`
    );

  return {
    viewDefinition: actualViewDefinition,
    formType: resolvedFormType ?? 'form',
    mode: mode === 'search' ? mode : altView.mode,
    model: strictGetModel(
      modelName === 'ObjectAttachmentIFace' ? 'Attachment' : modelName
    ),
  };
}

const parseViewDefinitions = (
  viewDefinitions: ViewDefinition['viewdefs']
): IR<Element> =>
  Object.fromEntries(
    Object.entries(viewDefinitions).map(([name, xml]) => {
      const parsed = parseXml(xml);
      if (typeof parsed === 'string')
        error(`Failed parsing XML for view definition`, {
          error: parsed,
          xml,
        });
      return [
        name,
        defined(
          parsed.querySelector('viewdef') ?? undefined,
          `Unable to find a <viewdef> tag for a ${name} view definition`
        ),
      ];
    })
  );

function resolveAltView(
  rawAltViews: ViewDefinition['altviews'],
  viewDefinitions: IR<Element>,
  formType: FormType,
  mode: FormMode
): {
  readonly altView: ViewDefinition['altviews'][number];
  readonly viewDefinition: Element;
} {
  let altViews: RA<AltView> = Object.values(rawAltViews).filter(
    (altView) => altView.mode === mode
  );
  if (altViews.length === 0) altViews = Object.values(rawAltViews);

  let viewDefinition: Element | undefined = undefined;
  let altView = altViews.find((altView) => {
    viewDefinition = viewDefinitions[altView.viewdef];
    return (
      typeof viewDefinition === 'object' &&
      getParsedAttribute(viewDefinition, 'type')?.toLowerCase() ===
        formType.toLowerCase()
    );
  });
  if (altView === undefined || viewDefinition === undefined) {
    console.error('No altView for defaultType:', formType);
    altView = altViews[0];
    viewDefinition = viewDefinitions[altView.viewdef];
  }
  return { altView, viewDefinition };
}

export type ParsedFormDefinition = {
  // Define column sizes: either a number of pixels, or undefined for auto sizing
  readonly columns: RA<number | undefined>;
  // A two-dimensional grid of cells
  readonly rows: RA<RA<FormCellDefinition>>;
};

function parseFormTableDefinition(
  viewDefinition: Element,
  model: SpecifyModel
): ParsedFormDefinition {
  const { rows } = parseFormDefinition(viewDefinition, model)[0].definition;
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
    .map<FormCellDefinition>((cell) => ({
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
          ? model?.getField(cell.fieldNames?.join('.') ?? '')?.label ??
            (cell.fieldNames?.join('.') as LocalizedString)
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
  return [
    ...(rawColumnDefinition ?? []),
    ...Array.from({
      length: columnCount - (rawColumnDefinition ?? []).length,
    }).fill(undefined),
  ];
}

export type ConditionalFormDefinition = RA<{
  readonly field: RA<LiteralField | Relationship> | undefined;
  readonly value: string | undefined;
  readonly definition: ParsedFormDefinition;
}>;

/**
 * Can't use querySelectorAll here because it is not supported in JSDom
 * See https://github.com/jsdom/jsdom/issues/2998
 */
export function parseFormDefinition(
  viewDefinition: Element,
  model: SpecifyModel
): ConditionalFormDefinition {
  setLogContext({
    tableName: model.name,
  });
  const parsed = Array.from(viewDefinition.children)
    .filter(({ tagName }) => tagName === 'rows')
    .map((rows, index) => {
      setLogContext({ definitionIndex: index });

      const definition = postProcessFormDef(
        processColumnDefinition(
          getColumnDefinitions(rows) ??
            getColumnDefinitions(viewDefinition) ??
            ''
        ),
        Array.from(rows.children)
          .filter(({ tagName }) => tagName === 'row')
          .map((row, index) => {
            setLogContext({ row: index + 1 });

            return Array.from(row.children)
              .filter(({ tagName }) => tagName === 'cell')
              .map((cell, index) => {
                setLogContext({ cell: index + 1 });

                return parseFormCell(model, cell);
              });
          }),
        model
      );
      const condition = getParsedAttribute(rows, 'condition')?.split('=');
      if (typeof condition === 'object') {
        const value = condition.slice(1).join('=');
        const parsedField = model.getFields(condition[0]);
        if (Array.isArray(parsedField)) {
          return {
            field: parsedField,
            value,
            definition,
          };
        }
      }
      return {
        definition,
        field: undefined,
        value: undefined,
      };
    });

  setLogContext({
    tableName: undefined,
    definitionIndex: undefined,
    row: undefined,
    cell: undefined,
  });
  return parsed;
}

function getColumnDefinitions(viewDefinition: Element): string | undefined {
  const definition =
    getColumnDefinition(
      viewDefinition,
      getPref('form.definition.columnSource')
    ) ?? getColumnDefinition(viewDefinition, undefined);
  return definition ?? getParsedAttribute(viewDefinition, 'colDef');
}

const getColumnDefinition = (
  viewDefinition: Element,
  os: string | undefined
): string | undefined =>
  // Can't use :scope > columnDef because js-dom doesn't support it
  Array.from(viewDefinition.children).find(
    (child) =>
      child.tagName === 'columnDef' &&
      (os === undefined || getParsedAttribute(child, 'os') === os)
  )?.textContent ?? undefined;

export const exportsForTests = {
  views,
  parseViewDefinitions,
  resolveAltView,
  parseFormTableDefinition,
  parseFormTableColumns,
  getColumnDefinitions,
  getColumnDefinition,
};
