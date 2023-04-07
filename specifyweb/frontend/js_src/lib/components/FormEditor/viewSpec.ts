import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import { tables } from '../DataModel/tables';
import { pipe, SpecToJson, Syncer, syncer } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import type { SimpleXmlNode } from '../Syncer/xmlToJson';
import { createSimpleXmlNode } from '../Syncer/xmlToJson';
import { createXmlSpec } from '../Syncer/xmlUtils';
import { filterArray, IR } from '../../utils/types';
import { SpecifyTable } from '../DataModel/specifyTable';

export const formDefinitionSpec = (table: SpecifyTable | undefined) =>
  createXmlSpec({
    columnDefinitions: pipe(
      syncers.xmlChildren('columnDef'),
      syncers.map(syncers.object(columnDefinitionSpec()))
    ),
    rowDefinition: pipe(
      syncers.xmlChild('rowDef', 'optional'),
      syncers.maybe(syncers.object(rowSizeDefinitionSpec()))
    ),
    legacyBusinessRules: pipe(
      syncers.xmlChild('enableRules', 'optional'),
      syncers.maybe(syncers.object(legacyBusinessRulesSpec()))
    ),
    rows: rows(table),
  });

const rows = (table: SpecifyTable | undefined) =>
  pipe(
    syncers.xmlChild('rows'),
    syncers.default<SimpleXmlNode>(createSimpleXmlNode),
    syncers.object(rowsSpec(table))
  );

const rowsSpec = (table: SpecifyTable | undefined) =>
  createXmlSpec({
    rows: pipe(
      syncers.xmlChildren('row'),
      syncers.map(
        pipe(
          syncers.xmlChildren('cell'),
          syncers.map(
            pipe(
              preProcessProps,
              syncers.object(cellSpec()),
              syncers.switch(
                'rest',
                'definition',
                pipe(
                  syncers.xmlAttribute('type', 'required'),
                  syncers.default('field')
                ),
                {
                  label: 'Label',
                  field: 'Field',
                  separator: 'Separator',
                  subview: 'SubView',
                  panel: 'Panel',
                  command: 'Command',
                  iconview: 'IconView',
                } as const,
                {
                  Label: labelSpec,
                  Field: fieldSpec,
                  Separator: separatorSpec,
                  SubView: subViewSpec,
                  Panel: panelSpec,
                  Command: commandSpec,
                  IconView: iconViewSpec,
                  unknown: emptySpec,
                } as const,
                table
              )
            )
          )
        )
      )
    ),
    condition: pipe(
      syncers.xmlAttribute('condition', 'skip'),
      syncer(
        (rawCondition) => {
          if (rawCondition === undefined) return undefined;
          const [rawField, ...condition] = rawCondition.split('=');
          const field = syncers.field(table?.name).serializer(rawField);
          return field === undefined
            ? undefined
            : {
                field,
                condition: condition.join('='),
              };
        },
        (props) => {
          if (props === undefined) return undefined;
          const { field, condition } = props;
          const joined = syncers.field(table?.name).deserializer(field);
          return joined === undefined || joined.length === 0
            ? undefined
            : `${joined}=${condition}`;
        }
      )
    ),
    columnDefinitions: syncers.xmlAttribute('colDef', 'skip'),
  });

/**
 * Split initialize="abc=def;ghi=jkl" into initialize abc="def" and initialize ghi="jkl"
 * Using space in the prefix intentionally as space is not allowed in XML
 * attributes, thus this won't cause a collision
 */
const attributeName = 'initialize';
const prefix = `${attributeName} `;
const preProcessProps = syncer<SimpleXmlNode, SimpleXmlNode>(
  (node) => ({
    ...node,
    attributes: {
      ...node.attributes,
      ...parseSpecifyProperties(node.attributes[attributeName], prefix),
    },
  }),
  (node) => {
    const entries = Object.entries(node.attributes);
    const props = Object.fromEntries(
      filterArray(
        entries.map(([key, value]) =>
          typeof value === 'string' &&
          value.length > 0 &&
          key.startsWith(prefix)
            ? [key.slice(prefix.length), value]
            : undefined
        )
      )
    );
    const rest = Object.fromEntries(
      entries.filter(([key]) => !key.startsWith(prefix))
    );
    return {
      ...node,
      attributes: {
        ...rest,
        [attributeName]: buildSpecifyProperties(props),
      },
    };
  }
);

type Cell = SpecToJson<
  ReturnType<typeof formDefinitionSpec>
>['rows']['rows'][number][number];

const columnDefinitionSpec = f.store(() =>
  createXmlSpec({
    // Commonly one of 'lnx', 'mac', 'exp'
    os: syncers.xmlAttribute('os', 'skip'),
    definition: syncers.xmlContent,
  })
);

const rowSizeDefinitionSpec = f.store(() =>
  createXmlSpec({
    auto: pipe(
      syncers.xmlAttribute('auto', 'skip'),
      syncers.default<LocalizedString>(''),
      syncers.toBoolean
    ),
    cell: syncers.xmlAttribute('cell', 'skip'),
    sep: syncers.xmlAttribute('cell', 'skip'),
    definition: syncers.xmlContent,
  })
);

const legacyBusinessRulesSpec = f.store(() =>
  createXmlSpec({
    id: syncers.xmlAttribute('id', 'required'),
    rule: syncers.xmlContent,
  })
);

/**
 * Build a list of tables for which the "formTable" display type should be
 * enabled. This list is not a perfect optimization of what tables have a
 * "formTable" display option in sp6 out of the box, but it's good enough
 */
const tablesWithFormTable = f.store(() =>
  Object.values(tables).filter(
    (table) => !table.isHidden && !table.overrides.isHidden && !table.isSystem
  )
);

const cellSpec = f.store(() =>
  createXmlSpec({
    id: syncers.xmlAttribute('id', 'skip'),
    // Make cell occupy more than one column
    colSpan: pipe(
      syncers.xmlAttribute('colSpan', 'skip'),
      syncers.maybe(syncers.toDecimal),
      syncers.default<number>(1)
    ),
    description: syncers.xmlAttribute('desc', 'skip'),
    // Specify 7 only
    // When invisible, field is rendered with visibility="hidden"
    visible: pipe(
      syncers.xmlAttribute('invisible', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false),
      syncer(
        (value) => !value,
        (value) => !value
      )
    ),
    title: syncers.xmlAttribute('initialize title', 'skip'),
    align: pipe(
      syncers.xmlAttribute('initialize align', 'skip'),
      syncers.maybe(syncers.enum(['left', 'right', 'center']))
    ),
    // Specify 7 only
    foregroundColor: syncers.xmlAttribute('initialize foregroundColor', 'skip'),
    // Specify 7 only
    foregroundColorDark: syncers.xmlAttribute(
      'initialize foregroundColorDark',
      'skip'
    ),
    legacyForegroundColor: syncers.xmlAttribute('initialize fg', 'skip'),
    legacyVisible: pipe(
      syncers.xmlAttribute('initialize visible', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(true)
    ),
    // In sp6, if true, disconnects the field from the database
    legacyIgnore: pipe(
      syncers.xmlAttribute('ignore', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
    // FIXME: check how this handles duplicate attributes (especially when they were modified)
    rest: syncers.captureLogContext(),
  })
);

export const parseSpecifyProperties = (value = '', prefix = ''): IR<string> =>
  Object.fromEntries(
    value.split(';').map((part) => {
      const [name, ...values] = part.split('=');
      return [
        `${prefix}${name.toLowerCase()}`,
        values.join('=').replaceAll('%3B', ';'),
      ] as const;
    })
  );

const buildSpecifyProperties = (properties: IR<string>) =>
  Object.entries(properties)
    .filter(([_key, value]) => value.length > 0)
    .map(
      ([key, value]) => `${key.toLowerCase()}=${value.replaceAll(';', '%3B')}`
    )
    .join(';');

const labelSpec = f.store(() =>
  createXmlSpec({
    label: syncers.xmlAttribute('label', 'skip'),
    labelForCellId: syncers.xmlAttribute('labelFor', 'skip'),
    icon: syncers.xmlAttribute('icon', 'skip'),
    legacyName: syncers.xmlAttribute('name', 'skip'),
  })
);

const separatorSpec = f.store(() =>
  createXmlSpec({
    label: syncers.xmlAttribute('label', 'skip'),
    icon: syncers.xmlAttribute('icon', 'skip'),
    forClass: pipe(
      syncers.xmlAttribute('forClass', 'skip'),
      syncers.maybe(syncers.tableName)
    ),
    canCollapse: pipe(
      syncers.xmlAttribute('collapse', 'skip'),
      syncers.default<LocalizedString>(''),
      syncers.toBoolean
    ),
  })
);

const borderSpec = createXmlSpec({
  legacyBorderStyle: pipe(
    syncers.xmlAttribute('initialize border', 'skip'),
    syncers.maybe(
      syncers.enum(['etched', 'lowered', 'raised', 'empty', 'line'])
    )
  ),
  // Used only if border style is line
  legacyBorderColor: syncers.xmlAttribute('initialize borderColor', 'skip'),
  legacyBackgroundColor: syncers.xmlAttribute('initialize bgColor', 'skip'),
});

const subViewSpec = (
  _cell: SpecToJson<ReturnType<typeof cellSpec>>,
  table: SpecifyTable | undefined
) =>
  createXmlSpec({
    // FIXME: parse further
    name: syncers.xmlAttribute('name', 'required'),
    defaultType: pipe(
      syncers.xmlAttribute('defaultType', 'skip'),
      syncers.maybe(syncers.enum(['form', 'table', 'icon'] as const))
    ),
    buttonLabel: syncers.xmlAttribute('label', 'skip'),
    viewSetName: syncers.xmlAttribute('viewSetName', 'skip'),
    viewName: syncers.xmlAttribute('viewName', 'skip'),
    isReadOnly: pipe(
      syncers.xmlAttribute('readOnly', 'skip'),
      syncers.default<LocalizedString>(''),
      syncers.toBoolean
    ),
    legacyRows: pipe(
      syncers.xmlAttribute('rows', 'skip'),
      syncers.maybe(syncers.toDecimal)
    ),
    legacyValidationType: pipe(
      syncers.xmlAttribute('valType', 'skip'),
      syncers.maybe(syncers.enum(['Changed', 'Focus', 'None', 'OK'] as const))
    ),
    displayAsButton: pipe(
      syncers.xmlAttribute('initialize btn', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    icon: syncers.xmlAttribute('initialize icon', 'skip'),
    legacyHelpContext: syncers.xmlAttribute('initialize hc', 'skip'),
    // Specify 7 only
    sortField: pipe(
      syncers.xmlAttribute('initialize sortField', 'skip'),
      syncers.maybe(syncers.field(table?.name))
    ),
    legacyNoScrollBars: pipe(
      syncers.xmlAttribute('initialize noScrollBars', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    legacyNoSeparator: pipe(
      syncers.xmlAttribute('initialize noSep', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    legacyNoSeparatorMoreButton: pipe(
      syncers.xmlAttribute('initialize noSepMoreBtn', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    legacyDisplayAsToMany: pipe(
      syncers.xmlAttribute('initialize many', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    legacyCollapse: pipe(
      syncers.xmlAttribute('initialize collapse', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    legacyAddSearch: pipe(
      syncers.xmlAttribute('initialize addSearch', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    legacyAddAdd: pipe(
      syncers.xmlAttribute('initialize addAdd', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    ...borderSpec,
  });

const panelSpec = (
  _cell: SpecToJson<ReturnType<typeof cellSpec>>,
  table: SpecifyTable | undefined
) =>
  createXmlSpec({
    columnDefinitions: syncers.xmlAttribute('colDef', 'skip'),
    rowDefinitions: syncers.xmlAttribute('rowDef', 'skip'),
    legacyName: syncers.xmlAttribute('name', 'skip'),
    ...borderSpec,
    rows: veryUnsafeRows(table),
  });

/**
 * This is not a correct TypeScript type, but it is necessary as TypeScript
 * is not yet able to infer the type of complex circular structures like
 * this.
 * See https://github.com/microsoft/TypeScript/issues/45213
 */
const veryUnsafeRows = (
  table: SpecifyTable | undefined
): Syncer<SimpleXmlNode, SimpleXmlNode> =>
  rows(table) as unknown as Syncer<SimpleXmlNode, SimpleXmlNode>;

const commandSpec = f.store(() =>
  createXmlSpec({
    name: pipe(
      syncers.xmlAttribute('name', 'required'),
      syncers.maybe(
        syncers.enum([
          'generateLabelBtn',
          'ShowLoansBtn',
          'ReturnLoan',
        ] as const)
      )
    ),
    legacyCommandType: pipe(
      syncers.xmlAttribute('commandType', 'skip'),
      syncers.maybe(
        syncers.enum(['Interactions', 'App', 'ClearCache'] as const)
      )
    ),
    legacyAction: pipe(
      syncers.xmlAttribute('action', 'skip'),
      syncers.maybe(syncers.enum(['ReturnLoan'] as const))
    ),
    label: syncers.xmlAttribute('label', 'skip'),
    legacyIsDefault: pipe(
      syncers.xmlAttribute('default', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
  })
);

const iconViewSpec = f.store(() =>
  createXmlSpec({
    name: syncers.xmlAttribute('name', 'skip'),
    viewSetName: syncers.xmlAttribute('viewSetName', 'skip'),
    viewName: syncers.xmlAttribute('viewName', 'skip'),
    legacyNoSeparator: pipe(
      syncers.xmlAttribute('initialize noSep', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(false)
    ),
    legacyNoMoreButton: pipe(
      syncers.xmlAttribute('initialize noSepMoreBtn', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(false)
    ),
  })
);

// FIXME: test that this carries over attributes and contents correctly
// FIXME: test changing cell type (and preserving attributes in the process???)
const emptySpec = f.store(() => createXmlSpec({}));

const fieldSpec = (
  cell: SpecToJson<ReturnType<typeof cellSpec>>,
  table: SpecifyTable | undefined
) =>
  createXmlSpec({
    field: pipe(
      syncers.object(rawFieldSpec(table)),
      syncers.switch(
        'rest',
        'definition',
        pipe(
          syncers.xmlAttribute('uiType', 'required'),
          syncers.default('text')
        ),
        {
          combobox: 'ComboBox',
          formattedtext: 'Text',
          text: 'Text',
          dsptextfield: 'Text',
          label: 'Text',
          textfieldinfo: 'Text',
          textarea: 'TextArea',
          // FIXME: allow switching between these text and textarea types in the UI
          textareabrief: 'TextArea',
          plugin: 'Plugin',
          querycbx: 'QueryComboBox',
          checkbox: 'CheckBox',
          tristate: 'TriState',
          spinner: 'Spinner',
          list: 'List',
          url: 'Url',
          image: 'Image',
          browse: 'Browse',
          colorchooser: 'ColorChooser',
        } as const,
        {
          ComboBox: comboBoxSpec,
          Text: textSpec,
          TextArea: textAreaSpec,
          Plugin: pluginSpec,
          QueryComboBox: queryComboBoxSpec,
          CheckBox: checkBoxSpec,
          // FIXME: figure out how this works in sp6
          TriState: emptySpec,
          Spinner: spinnerSpec,
          List: listSpec,
          Image: imageSpec,
          Url: emptySpec,
          Browse: browseSpec,
          ColorChooser: emptySpec,
          unknown: emptySpec,
        } as const,
        { cell, table }
      ),
      syncer(
        (cell) => ({
          ...cell,
          isReadOnly:
            cell.isReadOnly ||
            cell.definition.rawType === 'dsptextfield' ||
            cell.definition.rawType === 'label',
        }),
        (cell) => cell
      )
    ),
  });

const specialFieldNames = new Set([
  // Occurs in uiType="plugin"
  'this',
  // Occurs in uiType="checkbox"
  'generateLabelChk',
  // Occurs in uiType="checkbox"
  'generateInvoice',
  // Occurs in uiType="checkbox"
  'sendEMail',
]);

// FIXME: add defaults everywhere where appropriate
const rawFieldSpec = (table: SpecifyTable | undefined) =>
  createXmlSpec({
    name: pipe(
      syncers.xmlAttribute('name', 'skip'),
      syncers.preserveInvalid(
        syncer((name) => {
          const parsed = syncers.field(table?.name, false).serializer(name);
          if (
            parsed === undefined &&
            name !== undefined &&
            !specialFieldNames.has(name)
          )
            console.error(`Unknown field name: ${name}`);
          return parsed;
        }, syncers.field(table?.name).deserializer)
      )
    ),
    legacyEditOnCreate: pipe(
      syncers.xmlAttribute('initialize editOnCreate', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(false)
    ),
    isRequired: pipe(
      syncers.xmlAttribute('required', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(false)
    ),
    isReadOnly: pipe(
      syncers.xmlAttribute('readonly', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    legacyValidationType: pipe(
      syncers.xmlAttribute('valType', 'skip'),
      syncers.maybe(syncers.enum(['Changed', 'Focus'] as const)),
      syncers.default('Changed')
    ),
    defaultValue: syncers.xmlAttribute('default', 'skip'),
    // Example: '%s'
    legacyFormat: syncers.xmlAttribute('format', 'skip'),
    // Example: CollectingEventDetail
    dataObjectFormatter: syncers.xmlAttribute('formatName', 'skip'),
    uiFieldFormatter: syncers.xmlAttribute('uiFieldFormatter', 'skip'),
    rest: syncers.captureLogContext(),
  });

const comboBoxSpec = f.store(() =>
  createXmlSpec({
    pickListName: syncers.xmlAttribute('pickList', 'skip'),
    // FIXME: go over all attributes to see what sp7 should start supporting
    legacyData: pipe(
      syncers.xmlAttribute('initialize data', 'skip'),
      syncers.maybe(syncers.split(','))
    ),
  })
);

const textSpec = f.store(() =>
  createXmlSpec({
    minLength: pipe(
      syncers.xmlAttribute('initialize minLength', 'skip'),
      syncers.maybe(syncers.toDecimal)
    ),
    maxLength: pipe(
      syncers.xmlAttribute('initialize maxLength', 'skip'),
      syncers.maybe(syncers.toDecimal)
    ),
    isPassword: pipe(
      syncers.xmlAttribute('initialize isPassword', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(false)
    ),
    legacyColumns: pipe(
      syncers.xmlAttribute('cols', 'skip'),
      syncers.maybe(syncers.toDecimal),
      syncers.default(10)
    ),
    // Allow editing even the auto numbered part of the formatted field
    legacyAllEdit: pipe(
      syncers.xmlAttribute('initialize allEdit', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(false)
    ),
    // Allow entering only a part of the formatted field be typed in (used for search forms)
    legacyIsPartial: pipe(
      syncers.xmlAttribute('initialize isPartial', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(false)
    ),
    // Only displayed in sp6 for uiType="textfieldinfo"
    legacyDisplayDialog: syncers.xmlAttribute('initialize displayDlg', 'skip'),
    // Only used in sp6 for uiType="dsptextfield" and uiType="formattedtext"
    legacyTransparent: pipe(
      syncers.xmlAttribute('initialize transparent', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(false)
    ),
    /*
     * Used only if uiType="formattedtext". For Catalog Number field.
     * This is either for series data entry, or for displaying catalog number
     * field as separate inputs (one for each part of the formatter)
     */
    legacyIsSeries: pipe(
      syncers.xmlAttribute('initialize series', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(false)
    ),
    /*
     * Assume that the value received from the user is already formatted and
     * UI formatter does not need to be called. True by default only for numeric
     * catalog number formatter, for others, can be overwritten using this prop
     */
    legacyAssumeFormatted: pipe(
      syncers.xmlAttribute('initialize fromUiFmt', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(false)
    ),
  })
);

const textAreaSpec = (
  _field: SpecToJson<ReturnType<typeof rawFieldSpec>>,
  {
    rawType,
  }: {
    readonly rawType: string;
  }
) =>
  createXmlSpec({
    rows: pipe(
      syncers.xmlAttribute('rows', 'skip'),
      syncers.maybe(syncers.toDecimal),
      syncers.default(rawType === 'textareabrief' ? 1 : 4)
    ),
    legacyColumns: pipe(
      syncers.xmlAttribute('cols', 'skip'),
      syncers.maybe(syncers.toDecimal),
      syncers.default(10)
    ),
  });

const pluginSpec = (
  field: SpecToJson<ReturnType<typeof rawFieldSpec>>,
  {
    cell,
    table,
  }: {
    readonly cell: SpecToJson<ReturnType<typeof cellSpec>>;
    readonly table: SpecifyTable | undefined;
  }
) =>
  createXmlSpec({
    // Disable plugin if cell with this id has no value
    legacyWatchCellById: syncers.xmlAttribute('initialize watch', 'skip'),
  });

const queryComboBoxSpec = f.store(() =>
  createXmlSpec({
    // Customize view name
    dialogViewName: syncers.xmlAttribute('initialize displayDlg', 'skip'),
    searchDialogViewName: syncers.xmlAttribute('initialize searchDlg', 'skip'),
    showSearchButton: pipe(
      syncers.xmlAttribute('initialize searchBtn', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(true)
    ),
    showCloneButton: pipe(
      syncers.xmlAttribute('initialize cloneBtn', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(false)
    ),
    showEditButton: pipe(
      syncers.xmlAttribute('initialize editBtn', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(true)
    ),
    showNewButton: pipe(
      syncers.xmlAttribute('initialize newBtn', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(true)
    ),
    legacyHelpContext: syncers.xmlAttribute('initialize hc', 'skip'),
    // Make query compatible with multiple ORMs
    legacyAdjustQuery: pipe(
      syncers.xmlAttribute('initialize adjustQuery', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(true)
    ),
  })
);

const checkBoxSpec = f.store(() =>
  createXmlSpec({
    label: syncers.xmlAttribute('label', 'skip'),
    // FIXME: figure out how this works in sp6
    legacyIsEditable: pipe(
      syncers.xmlAttribute('initialize editable', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(false)
    ),
  })
);

const spinnerSpec = f.store(() =>
  createXmlSpec({
    min: pipe(
      syncers.xmlAttribute('initialize min', 'skip'),
      syncers.maybe(syncers.toFloat)
    ),
    max: pipe(
      syncers.xmlAttribute('initialize max', 'skip'),
      syncers.maybe(syncers.toFloat)
    ),
    // Specify 7 only
    step: pipe(
      syncers.xmlAttribute('initialize step', 'skip'),
      syncers.maybe(syncers.toFloat)
    ),
  })
);

const listSpec = f.store(() =>
  createXmlSpec({
    legacyDisplayType: syncers.xmlAttribute('dsptype', 'skip'),
    legacyRows: pipe(
      syncers.xmlAttribute('rows', 'skip'),
      syncers.maybe(syncers.toDecimal),
      syncers.default(15)
    ),
    legacyData: pipe(
      syncers.xmlAttribute('data', 'skip'),
      syncers.maybe(syncers.split(','))
    ),
  })
);

const imageSpec = f.store(() =>
  createXmlSpec({
    size: pipe(
      syncers.xmlAttribute('initialize size', 'skip'),
      // Format: width,height in px
      syncers.default('150,150'),
      syncers.split(','),
      syncers.map(syncers.toDecimal)
    ),
    /*
     * Whether to display the image. By default the image is only
     * displayed when in edit mode
     */
    legacyIsVisible: pipe(
      syncers.xmlAttribute('initialize edit', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
    legacyHasBorder: pipe(
      syncers.xmlAttribute('initialize border', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(true)
    ),
    legacyUrl: syncers.xmlAttribute('initialize url', 'skip'),
    legacyIcon: syncers.xmlAttribute('initialize icon', 'skip'),
    legacyIconSize: pipe(
      syncers.xmlAttribute('initialize iconSize', 'skip'),
      syncers.maybe(syncers.toDecimal),
      syncers.maybe(syncers.numericEnum([16, 24, 32] as const))
    ),
  })
);

const browseSpec = f.store(() =>
  createXmlSpec({
    legacyDirectoriesOnly: pipe(
      syncers.xmlAttribute('initialize dirsonly', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(false)
    ),
    legacyUseAlternateFilePicker: pipe(
      syncers.xmlAttribute('initialize forInput', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default(true)
    ),
    /*
     * Extension to filter files by. Example "jpg". Only one is supported
     * Fed into:
     * https://docs.oracle.com/javase/7/docs/api/javax/swing/filechooser/FileNameExtensionFilter.html
     */
    legacyFilter: syncers.xmlAttribute('initialize fileFilter', 'skip'),
    /*
     * Human friendly description of what files are allowed
     */
    legacyFilterDescription: syncers.xmlAttribute(
      'initialize fileFilterDesc',
      'skip'
    ),
    /*
     * Example "jpeg". Adds that extension to picked file name if not already
     * present
     */
    legacyDefaultExtension: syncers.xmlAttribute(
      'initialize defaultExtension',
      'skip'
    ),
  })
);

export const exportsForTests = {
  tablesWithFormTable,
  buildSpecifyProperties,
};
