/**
 * Converts XML form and formTable definitions to JSON, while also
 * adding type safety and strictness to help resolve ambiguities
 */

import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { f } from '../../utils/functools';
import type { IR, R, RA } from '../../utils/types';
import {
  defined,
  filterArray,
  localized,
  overwriteReadOnly,
} from '../../utils/types';
import { removeKey } from '../../utils/utils';
import { parseXml } from '../AppResources/parseXml';
import { formatDisjunction } from '../Atoms/Internationalization';
import { backboneFieldSeparator } from '../DataModel/helpers';
import { parseJavaClassName } from '../DataModel/resource';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTable, strictGetTable } from '../DataModel/tables';
import { error } from '../Errors/assert';
import type { LogMessage } from '../Errors/interceptLogs';
import { captureLogOutput } from '../Errors/interceptLogs';
import {
  addContext,
  getLogContext,
  pushContext,
  setLogContext,
} from '../Errors/logContext';
import { cachableUrl } from '../InitialContext';
import { getPref } from '../InitialContext/remotePrefs';
import { formatUrl } from '../Router/queryString';
import type { SimpleXmlNode } from '../Syncer/xmlToJson';
import { toSimpleXmlNode, xmlToJson } from '../Syncer/xmlToJson';
import { getAttribute, getParsedAttribute } from '../Syncer/xmlUtils';
import type { FormCellDefinition } from './cells';
import { parseFormCell, processColumnDefinition } from './cells';
import { postProcessFormDef } from './postProcessFormDef';
import { webOnlyViews } from './webOnlyViews';

export type ViewDescription = ParsedFormDefinition & {
  readonly formType: FormType;
  readonly mode: FormMode;
  readonly table: SpecifyTable;
  readonly errors?: RA<LogMessage>;
  readonly viewSetId?: number;
  readonly name: string;
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
  readonly name: LocalizedString;
  readonly view: string;
  readonly resourcelabels: 'false' | 'true';
  readonly viewdefs: IR<string>;
  readonly viewsetLevel: string;
  readonly viewsetName: string;
  readonly viewsetSource: string;
  readonly viewsetId: number | null;
  readonly viewsetFile: string | null;

  // REFACTOR: remove this once Specify 7 gets default forms
  /**
   * If `defaulttype` is not specified on a subview cell, Specify assumes the
   * subview should be rendered in 'Form' mode. However there are many default
   * `to-many` subviews which do not specify a `defaulttype` and should be
   * rendered as a table by default
   *
   * See https://github.com/specify/specify7/issues/4878
   */
  readonly defaultSubviewFormType?: FormType;
};

export const formTypes = ['form', 'formTable'] as const;
export type FormType = (typeof formTypes)[number];
export type FormMode = 'edit' | 'search' | 'view';

let views: R<ViewDefinition | undefined> = {};

export const getViewSetApiUrl = (viewName: string): string =>
  formatUrl('/context/view.json', {
    name: viewName,
    // Don't spam the console with errors needlessly
    quiet:
      // BUG: viewName is not always same as tableName, thus getTable() won't work
      viewName in webOnlyViews() || getTable(viewName)?.isSystem === true
        ? ''
        : undefined,
  });

export function clearViewLocal(viewName: string): void {
  views = removeKey(views, viewName);
}

export const fetchView = async (
  name: string
): Promise<ViewDefinition | undefined> =>
  name in views
    ? views[name]
    : ajax(
        /*
         * NOTE: If getView hasn't yet been invoked, the view URL won't be
         * marked as cachable
         */
        cachableUrl(getViewSetApiUrl(name)),
        {
          headers: { Accept: 'text/plain' },
          expectedErrors: [Http.NOT_FOUND],
        }
      )
        .then(async ({ data, status }) => {
          if (status === Http.NOT_FOUND)
            console.error(
              `Unable to find a view definition for the "${name}" view`
            );

          return status === Http.NOT_FOUND || status === Http.NO_CONTENT
            ? undefined
            : correctDefaultViewDefinition(JSON.parse(data) as ViewDefinition);
        })
        .then((viewDefinition) => {
          // FEATURE: add an easy way to cache ajax responses:
          views[name] = viewDefinition;

          return views[name];
        });

// REFACTOR: Remove the need for this once Specify 7 has its own default forms
async function correctDefaultViewDefinition(
  view: ViewDefinition
): Promise<ViewDefinition> {
  const viewDefinitions = parseViewDefinitions(view.viewdefs);
  if (Object.keys(viewDefinitions).length === 0) {
    console.error(`No view definitions found for the ${view.name} view`);
    return view;
  }

  /**
   * In the default forms for Specify 6, there are multiple ways to represent
   * FormTables for SubViews.
   * One problematic way to represent the Expanded and Collapsed
   * states of the SubView is to separate the states into entirely
   * separate views. If the Collapsed view needs to be expanded, it is assumed
   * to use the view definition for the Expanded view
   * (which is usually the default view as stated in the datamodel xml file,
   * i.e. the table.view)
   * See:
   *  https://github.com/specify/specify7/issues/2412#issuecomment-1327967090
   *  https://github.com/specify/specify7/pull/4760#issuecomment-2046022176
   */
  const useDefaultExpanded =
    new Set(Object.values(view.altviews).map((altView) => altView.viewdef))
      .size === 1 &&
    getAttribute(
      xmlToJson(viewDefinitions[Object.values(view.altviews)[0].viewdef]),
      'type'
    ) === 'formtable';

  if (useDefaultExpanded) {
    /**
     * To correctly resolve this case, the non-formtable altviews and viewdefs
     * of the table's default View are merged into the definition of the
     * view which is supposed to represent the Collapsed/Grid view for the
     * table
     */
    return fetchView(strictGetTable(view.class).view).then(
      (defaultExpandedDefinition) => {
        if (defaultExpandedDefinition === undefined) return view;

        const defaultViewDefs = parseViewDefinitions(
          defaultExpandedDefinition.viewdefs
        );

        const newAltViews = {
          ...view.altviews,
          ...Object.fromEntries(
            Object.entries(defaultExpandedDefinition.altviews).filter(
              ([_, { viewdef }]) =>
                getAttribute(xmlToJson(defaultViewDefs[viewdef]), 'type') !==
                'formtable'
            )
          ),
        };
        const newViewDefs = {
          ...view.viewdefs,
          ...Object.fromEntries(
            Object.entries(defaultExpandedDefinition.viewdefs).filter(
              // eslint-disable-next-line unicorn/prevent-abbreviations
              ([viewDefName, _]) =>
                getAttribute(
                  xmlToJson(defaultViewDefs[viewDefName]),
                  'type'
                ) !== 'formtable'
            )
          ),
        };
        overwriteReadOnly(view, 'defaultSubviewFormType', 'formTable');
        overwriteReadOnly(view, 'altviews', newAltViews);
        overwriteReadOnly(view, 'viewdefs', newViewDefs);
        return view;
      }
    );
  }
  return view;
}

export async function parseViewDefinition(
  view: ViewDefinition,
  defaultType: FormType,
  originalMode: FormMode,
  currentTable: SpecifyTable
): Promise<ViewDescription | undefined> {
  const logContext = getLogContext();
  addContext({ view, defaultType, originalMode });

  const resolved = resolveViewDefinition(view, defaultType, originalMode);
  if (resolved === undefined) return undefined;
  addContext({ resolved });
  const { mode, formType, viewDefinition, table = currentTable } = resolved;

  const parser =
    formType === 'formTable'
      ? parseFormTableDefinition
      : async (
          viewDefinition: SimpleXmlNode,
          table: SpecifyTable
        ): Promise<ParsedFormDefinition> =>
          parseFormDefinition(viewDefinition, table).then(
            (definition) => definition[0].definition
          );

  const [errors, parsed] = captureLogOutput(async () =>
    parser(viewDefinition, table)
  );
  setLogContext(logContext);

  return {
    mode,
    formType,
    table,
    viewSetId: view.viewsetId ?? undefined,
    errors,
    name: view.name,
    ...(await parsed),
  };
}

export function resolveViewDefinition(
  view: ViewDefinition,
  formType: FormType,
  mode: FormMode
):
  | {
      readonly viewDefinition: SimpleXmlNode;
      readonly formType: FormType;
      readonly mode: FormMode;
      readonly table: SpecifyTable | undefined;
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

  const definition = viewDefinition.children.definition?.at(0)?.text;
  const actualViewDefinition =
    typeof definition === 'string'
      ? toSimpleXmlNode(xmlToJson(viewDefinitions[definition]))
      : viewDefinition;

  if (actualViewDefinition === undefined) return undefined;
  const actualDefinition = actualViewDefinition;

  const newFormType = getParsedAttribute(viewDefinition, 'type');
  const className = getParsedAttribute(actualDefinition, 'class');
  const tableName = f.maybe(className, parseJavaClassName);
  const resolvedFormType =
    formType === 'formTable'
      ? 'formTable'
      : (formTypes.find(
          (type) => type.toLowerCase() === newFormType?.toLowerCase()
        ) ?? 'form');
  if (resolvedFormType === undefined)
    console.warn(
      `Unknown form type ${
        newFormType ?? '(null)'
      }. Expected one of ${formatDisjunction(formTypes.map(localized))}`
    );

  return {
    viewDefinition: actualDefinition,
    formType: resolvedFormType ?? 'form',
    mode: mode === 'search' ? mode : altView.mode,
    table:
      tableName === undefined
        ? undefined
        : strictGetTable(
            tableName === 'ObjectAttachmentIFace' ? 'Attachment' : tableName
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
        parsed.tagName.toLowerCase() === 'viewdef'
          ? parsed
          : defined(
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
  readonly viewDefinition: SimpleXmlNode;
} {
  let altViews: RA<AltView> = Object.values(rawAltViews).filter(
    (altView) => altView.mode === mode
  );
  if (altViews.length === 0) altViews = Object.values(rawAltViews);

  let viewDefinition: Element | undefined = undefined;
  let altView = altViews.find((altView) => {
    viewDefinition = viewDefinitions[altView.viewdef];
    return (
      viewDefinition?.getAttribute('type')?.toLowerCase() ===
      formType.toLowerCase()
    );
  });
  if (altView === undefined || viewDefinition === undefined) {
    altView = altViews[0];
    viewDefinition = viewDefinitions[altView.viewdef];
  }
  return {
    altView,
    viewDefinition: toSimpleXmlNode(xmlToJson(viewDefinition)),
  };
}

export type ParsedFormDefinition = {
  // Define column sizes: either a number of pixels, or undefined for auto sizing
  readonly columns: RA<number | undefined>;
  // A two-dimensional grid of cells
  readonly rows: RA<RA<FormCellDefinition>>;
};

async function parseFormTableDefinition(
  viewDefinition: SimpleXmlNode,
  table: SpecifyTable
): Promise<ParsedFormDefinition> {
  const definition = await parseFormDefinition(viewDefinition, table);

  const { rows } = definition[0].definition;

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
    /*
     * FEATURE: extract fields from panels too
     */
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
          ? (table?.getField(
              cell.fieldNames?.join(backboneFieldSeparator) ?? ''
            )?.label ??
            localized(cell.fieldNames?.join(backboneFieldSeparator)))
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
  viewDefinition: SimpleXmlNode,
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
export type FormCondition =
  | State<
      'Value',
      {
        readonly field: RA<LiteralField | Relationship>;
        readonly value: string;
      }
    >
  | State<'Always'>
  | undefined;

export const EMPTY_VALUE_CONDITION = '_EMPTY';

export type ConditionalFormDefinition = RA<{
  readonly condition: FormCondition;
  readonly definition: ParsedFormDefinition;
}>;

export async function parseFormDefinition(
  viewDefinition: SimpleXmlNode,
  table: SpecifyTable
): Promise<ConditionalFormDefinition> {
  const rowsContainers = viewDefinition?.children?.rows ?? [];
  const context = getLogContext();
  const definition = await Promise.all(
    rowsContainers.map(async (rowsContainer, definitionIndex) => {
      const context = getLogContext();
      pushContext({
        type: 'Root',
        node: rowsContainer,
        extras: { definitionIndex },
      });
      const directColumnDefinitions = getColumnDefinitions(rowsContainer);
      const rows = rowsContainer?.children?.row ?? [];
      const definition = postProcessFormDef(
        processColumnDefinition(
          directColumnDefinitions.length === 0
            ? getColumnDefinitions(viewDefinition)
            : directColumnDefinitions
        ),
        await parseRows(rows, table),
        table
      );

      const condition = getParsedAttribute(rowsContainer, 'condition')?.split(
        '='
      );
      if (typeof condition === 'object') {
        if (condition.length === 1 && condition[0] === 'always')
          return { condition: { type: 'Always' }, definition } as const;
        const value = condition.slice(1).join('=');
        const parsedField = table.getFields(condition[0]);
        if (Array.isArray(parsedField)) {
          return {
            condition: {
              type: 'Value',
              field: parsedField,
              value,
            },
            definition,
          } as const;
        }
      }

      setLogContext(context);
      return { condition: undefined, definition };
    })
  );

  setLogContext(context);
  return definition;
}

function getColumnDefinitions(viewDefinition: SimpleXmlNode): string {
  const definition =
    getColumnDefinition(
      viewDefinition,
      getPref('form.definition.columnSource')
    ) ?? getColumnDefinition(viewDefinition, undefined);
  // Specify 7 handles forms without column definition fine, so no need to warn for this
  return definition ?? getParsedAttribute(viewDefinition, 'colDef') ?? '';
}

const getColumnDefinition = (
  viewDefinition: SimpleXmlNode,
  os: string | undefined
): string | undefined =>
  viewDefinition.children.columnDef?.find((child) =>
    typeof os === 'string' ? getParsedAttribute(child, 'os') === os : true
  )?.text;

const parseRows = async (
  rawRows: RA<SimpleXmlNode>,
  table: SpecifyTable
): Promise<RA<RA<FormCellDefinition>>> =>
  Promise.all(
    rawRows.map(async (row, index) => {
      const context = getLogContext();
      pushContext({
        type: 'Child',
        tagName: 'row',
        extras: { row: index + 1 },
      });

      const data = await Promise.all(
        (row.children.cell ?? []).map(async (cell, index) => {
          const context = getLogContext();
          pushContext({
            type: 'Child',
            tagName: 'cell',
            extras: { cell: index + 1 },
          });
          const data = await parseFormCell(table, cell);

          setLogContext(context);
          return data;
        })
      );
      setLogContext(context);
      return data ?? [];
    })
  );

export const exportsForTests = {
  views,
  parseViewDefinitions,
  resolveAltView,
  parseFormTableDefinition,
  parseFormTableColumns,
  getColumnDefinitions,
  getColumnDefinition,
  parseRows,
};
