import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import type { IR, RA, RR } from '../../utils/types';
import { filterArray, localized } from '../../utils/types';
import { formatDisjunction } from '../Atoms/Internationalization';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { genericTables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import type { FormCondition } from '../FormParse';
import { paleoPluginTables } from '../FormPlugins/PaleoLocation';
import { toLargeSortConfig, toSmallSortConfig } from '../Molecules/Sorting';
import type { SpecToJson, Syncer } from '../Syncer';
import { pipe, syncer } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import type { SimpleXmlNode } from '../Syncer/xmlToJson';
import { createSimpleXmlNode } from '../Syncer/xmlToJson';
import { createXmlSpec } from '../Syncer/xmlUtils';

/* eslint-disable @typescript-eslint/no-magic-numbers */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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
      /*
       * This element is often present, but empty. Looking at sp6 code, there
       * is no difference between it being emmpty and not being there at all
       */
      syncers.xmlChild('enableRules', 'optional'),
      syncers.maybe(syncers.object(legacyBusinessRulesSpec()))
    ),
    definitions: definitions(table),
  });

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const definitions = (table: SpecifyTable | undefined) =>
  pipe(
    syncers.xmlChildren('rows'),
    syncers.fallback<RA<SimpleXmlNode>>(() => [createSimpleXmlNode()]),
    syncers.map(syncers.object(rowsSpec(table)))
  );

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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
                  syncers.fallback(localized('field'))
                ),
                {
                  label: 'Label',
                  field: 'Field',
                  separator: 'Separator',
                  subview: 'SubView',
                  panel: 'Panel',
                  command: 'Command',
                  iconview: 'IconView',
                  blank: 'Blank',
                } as const,
                {
                  Label: labelSpec,
                  Field: fieldSpec,
                  Separator: separatorSpec,
                  SubView: subViewSpec,
                  Panel: panelSpec,
                  Command: commandSpec,
                  IconView: iconViewSpec,
                  Blank: emptySpec,
                  Unknown: emptySpec,
                } as const,
                table
              ),
              // Make sure command is on a correct table
              syncers.change(
                'definition',
                (cell) => {
                  if (cell.definition.type !== 'Command')
                    return cell.definition;
                  const name =
                    cell.definition.name ??
                    (f.includes(
                      Object.keys(commandTables),
                      cell.definition.label
                    )
                      ? cell.definition.label
                      : undefined);
                  if (name === undefined) return cell.definition;
                  const allowedTable = commandTables[name];
                  if (
                    allowedTable !== undefined &&
                    table !== undefined &&
                    allowedTable !== table.name
                  ) {
                    console.error(
                      `Can't display ${
                        cell.definition.label ?? name ?? 'plugin'
                      } on the ${table.name} form. Instead, try ` +
                        `displaying it on the ${genericTables[allowedTable].label} form`
                    );
                    return { ...cell.definition, name: undefined };
                  }
                  return {
                    ...cell.definition,
                    name,
                  };
                },
                ({ definition }) => definition
              )
            )
          )
        )
      )
    ),
    condition: pipe(
      syncers.xmlAttribute('condition', 'skip', false),
      syncer<LocalizedString | undefined, FormCondition>(
        (rawCondition) => {
          if (rawCondition === undefined) return undefined;
          const isAlways = rawCondition.trim() === 'always';
          if (isAlways) return { type: 'Always' } as const;
          const [rawField, ...condition] = rawCondition.split('=');
          const field = syncers.field(table?.name).serializer(rawField);
          return field === undefined
            ? undefined
            : ({
                type: 'Value',
                field,
                value: condition.join('='),
              } as const);
        },
        (props) => {
          if (props === undefined) return undefined;
          if (props.type === 'Always') return localized('always');
          const { field, value } = props;
          const joined = syncers.field(table?.name).deserializer(field);
          return joined === undefined || joined.length === 0
            ? undefined
            : localized(`${joined}=${value}`);
        }
      )
    ),
    columnDefinitions: pipe(
      syncers.xmlAttribute('colDef', 'skip'),
      syncers.default(localized('')),
      syncers.split(',')
    ),
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
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    cell: syncers.xmlAttribute('cell', 'skip'),
    sep: syncers.xmlAttribute('sep', 'skip'),
    definition: pipe(
      syncers.xmlContent,
      syncers.default(''),
      syncers.split(',')
    ),
  })
);

const legacyBusinessRulesSpec = f.store(() =>
  createXmlSpec({
    id: syncers.xmlAttribute('id', 'skip'),
    rule: syncers.xmlContent,
  })
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
    /*
     * Specify 7 only
     * When invisible, field is rendered with visibility="hidden"
     */
    visible: pipe(
      syncers.xmlAttribute('invisible', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false),
      syncers.flip
    ),
    title: syncers.xmlAttribute('initialize title', 'skip'),
    // Default: right for labels, left for the rest
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
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    rest: syncers.captureLogContext(),
  })
);

export const parseSpecifyProperties = (value = '', prefix = ''): IR<string> =>
  Object.fromEntries(
    filterArray(
      value.split(';').map((part) => {
        const [rawName, ...values] = part.split('=');
        const name = rawName.toLowerCase().trim();
        return name.length === 0
          ? undefined
          : ([
              `${prefix}${name}`,
              values.join('=').trim().replaceAll('%3B', ';'),
            ] as const);
      })
    )
  );

const buildSpecifyProperties = (properties: IR<string>): string =>
  Object.entries(properties)
    .filter(([key, value]) => key.length > 0 && value.length > 0)
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
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
  })
);

const borderSpec = f.store(() =>
  createXmlSpec({
    legacyBorderStyle: pipe(
      syncers.xmlAttribute('initialize border', 'skip'),
      syncers.maybe(
        syncers.enum(['etched', 'lowered', 'raised', 'empty', 'line'])
      )
    ),
    // Used only if border style is line
    legacyBorderColor: syncers.xmlAttribute('initialize borderColor', 'skip'),
    legacyBackgroundColor: syncers.xmlAttribute('initialize bgColor', 'skip'),
  })
);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const subViewSpec = (
  cell: SpecToJson<ReturnType<typeof cellSpec>>,
  table: SpecifyTable | undefined
) =>
  createXmlSpec({
    name: pipe(
      syncers.xmlAttribute('name', 'required'),
      syncers.maybe(syncers.field(table?.name)),
      syncer(
        (fields: RA<LiteralField | Relationship> | undefined) => {
          const field = fields?.at(-1);
          if (field?.isRelationship === false) {
            console.error('SubView can only be used to display a relationship');
            return undefined;
          }
          if (field?.type === 'many-to-many') {
            // ResourceApi does not support .rget() on a many-to-many
            console.warn('Many-to-many relationships are not supported');
          }
          return fields;
        },
        (field) => field
      )
    ),
    defaultType: pipe(
      syncers.xmlAttribute('defaultType', 'skip'),
      syncers.maybe(syncers.enum(['form', 'table', 'icon'] as const))
    ),
    buttonLabel: syncers.xmlAttribute('label', 'skip'),
    viewSetName: syncers.xmlAttribute('viewSetName', 'skip'),
    viewName: syncers.xmlAttribute('viewName', 'skip'),
    isReadOnly: pipe(
      syncers.xmlAttribute('readOnly', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    legacyRows: pipe(
      syncers.xmlAttribute('rows', 'skip'),
      syncers.maybe(syncers.toDecimal),
      syncers.default(5)
    ),
    legacyValidationType: pipe(
      syncers.xmlAttribute('valType', 'skip'),
      syncers.maybe(syncers.enum(['Changed', 'Focus', 'None', 'OK'] as const)),
      syncers.default('Changed')
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
      syncers.maybe(
        syncer(
          (raw: string) => {
            const cellName = cell.rest.node.attributes.name;
            const cellRelationship =
              typeof cellName === 'string'
                ? syncers.field(table?.name).serializer(cellName)?.at(-1)
                : undefined;
            const cellRelatedTableName =
              cellRelationship?.isRelationship === true
                ? cellRelationship.relatedTable.name
                : undefined;
            const parsed = toLargeSortConfig(raw);
            const fieldNames = syncers
              .field(cellRelatedTableName)
              .serializer(parsed.fieldNames.join('.'));
            return fieldNames === undefined
              ? undefined
              : {
                  ...parsed,
                  fieldNames,
                };
          },
          (parsed) =>
            parsed === undefined
              ? ''
              : toSmallSortConfig({
                  ...parsed,
                  fieldNames: parsed.fieldNames.map(({ name }) => name),
                })
        )
      )
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
    ...borderSpec(),
  });

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const panelSpec = (
  _cell: SpecToJson<ReturnType<typeof cellSpec>>,
  table: SpecifyTable | undefined
) =>
  createXmlSpec({
    columnDefinitions: pipe(
      syncers.xmlAttribute('colDef', 'skip'),
      syncers.default(localized('')),
      syncers.split(',')
    ),
    rowDefinitions: pipe(
      syncers.xmlAttribute('rowDef', 'skip'),
      syncers.default(localized('')),
      syncers.split(',')
    ),
    /*
     * This is recognized by sp6 code, but never actually used to influence
     * anything.
     * The original sp6 docs mention that if set to "buttonbar", the elements
     * would be centered.
     */
    panelType: syncers.xmlAttribute('initialize panelType', 'skip'),
    // Used by sp6 to control panels (using hardcoded java logic)
    legacyName: syncers.xmlAttribute('name', 'skip'),
    ...borderSpec(),
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
  definitions(table) as unknown as Syncer<SimpleXmlNode, SimpleXmlNode>;

const commandTables = {
  generateLabelBtn: undefined,
  ShowLoansBtn: 'Preparation',
  ReturnLoan: 'Loan',
} as const;

const commandSpec = f.store(() =>
  createXmlSpec({
    name: pipe(
      syncers.xmlAttribute('name', 'required'),
      syncers.maybe(syncers.enum(Object.keys(commandTables)))
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
    label: pipe(
      syncers.xmlAttribute('label', 'skip'),
      syncers.maybe(
        // A migration for https://github.com/specify/specify6/issues/203
        syncer(
          (label) =>
            label === 'SHOW_LOANS' ? localized('SHOW_INTERACTIONS') : label,
          f.id
        )
      )
    ),
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
      syncers.default<boolean>(false)
    ),
    legacyNoMoreButton: pipe(
      syncers.xmlAttribute('initialize noSepMoreBtn', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
  })
);

// FIXME: when changing cell type, remove attributes
const emptySpec = f.store(() => createXmlSpec({}));

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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
          syncers.fallback(localized('text'))
        ),
        {
          combobox: 'ComboBox',
          text: 'Text',
          formattedtext: 'Text',
          dsptextfield: 'Text',
          label: 'Text',
          textfieldinfo: 'Text',
          textarea: 'TextArea',
          // FEATURE: allow switching between these text and textarea types in the UI
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
          Plugin: pluginWrapperSpec,
          QueryComboBox: queryComboBoxSpec,
          CheckBox: checkBoxSpec,
          // TEST: figure out how this works in sp6
          TriState: checkBoxSpec,
          Spinner: spinnerSpec,
          List: listSpec,
          Image: imageSpec,
          Url: emptySpec,
          Browse: browseSpec,
          ColorChooser: emptySpec,
          Unknown: emptySpec,
        } as const,
        { cell, table }
      ),
      syncers.change(
        'isReadOnly',
        (cell) =>
          cell.isReadOnly ||
          cell.definition.rawType === 'dsptextfield' ||
          cell.definition.rawType === 'label',
        ({ isReadOnly }) => isReadOnly
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

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const rawFieldSpec = (table: SpecifyTable | undefined) =>
  createXmlSpec({
    field: pipe(
      syncers.xmlAttribute('name', 'skip'),
      syncers.preserveInvalid(
        syncer((name) => {
          const parsed = syncers.field(table?.name, 'silent').serializer(name);
          if (
            parsed === undefined &&
            name !== undefined &&
            !specialFieldNames.has(name)
          )
            console.error(`Unknown field name: ${name}`);
          return parsed;
        }, syncers.field(table?.name, 'strict').deserializer)
      )
    ),
    legacyEditOnCreate: pipe(
      syncers.xmlAttribute('initialize editOnCreate', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    isRequired: pipe(
      syncers.xmlAttribute('required', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
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
    legacyFormat: syncers.xmlAttribute('format', 'skip', false),
    // Example: CollectingEventDetail
    dataObjectFormatter: syncers.xmlAttribute('formatName', 'skip'),
    // Example: CatalogNumberNumeric
    uiFieldFormatter: syncers.xmlAttribute('uiFieldFormatter', 'skip'),
    rest: syncers.captureLogContext(),
  });

const comboBoxSpec = f.store(() =>
  createXmlSpec({
    pickListName: syncers.xmlAttribute('pickList', 'skip'),
    // FEATURE: go over all attributes to see what sp7 should start supporting
    legacyData: pipe(
      syncers.xmlAttribute('initialize data', 'skip', false),
      syncers.maybe(syncers.fancySplit(','))
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
      syncers.default<boolean>(false)
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
      syncers.default<boolean>(false)
    ),
    // Allow entering only a part of the formatted field be typed in (used for search forms)
    legacyIsPartial: pipe(
      syncers.xmlAttribute('initialize isPartial', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    // Only displayed in sp6 for uiType="textfieldinfo"
    legacyDisplayDialog: syncers.xmlAttribute('initialize displayDlg', 'skip'),
    // Only used in sp6 for uiType="dsptextfield" and uiType="formattedtext"
    legacyTransparent: pipe(
      syncers.xmlAttribute('initialize transparent', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    /*
     * Used only if uiType="formattedtext". For Catalog Number field.
     * This is either for series data entry, or for displaying catalog number
     * field as separate inputs (one for each part of the formatter)
     */
    legacyIsSeries: pipe(
      syncers.xmlAttribute('initialize series', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    /*
     * Assume that the value received from the user is already formatted and
     * UI formatter does not need to be called. True by default only for numeric
     * catalog number formatter, for others, can be overwritten using this prop
     */
    legacyAssumeFormatted: pipe(
      syncers.xmlAttribute('initialize fromUiFmt', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
  })
);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const textAreaSpec = (
  _field: SpecToJson<ReturnType<typeof rawFieldSpec>>,
  _: unknown,
  rawType: string
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

const queryComboBoxSpec = f.store(() =>
  createXmlSpec({
    // Customize view name
    dialogViewName: syncers.xmlAttribute('initialize displayDlg', 'skip'),
    searchDialogViewName: syncers.xmlAttribute('initialize searchDlg', 'skip'),
    showSearchButton: pipe(
      syncers.xmlAttribute('initialize searchBtn', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(true)
    ),
    showCloneButton: pipe(
      syncers.xmlAttribute('initialize cloneBtn', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    showViewButton: pipe(
      syncers.xmlAttribute('initialize viewBtn', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    showEditButton: pipe(
      syncers.xmlAttribute('initialize editBtn', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(true)
    ),
    showNewButton: pipe(
      syncers.xmlAttribute('initialize newBtn', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(true)
    ),
    legacyHelpContext: syncers.xmlAttribute('initialize hc', 'skip'),
    // Make query compatible with multiple ORMs
    legacyAdjustQuery: pipe(
      syncers.xmlAttribute('initialize adjustQuery', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(true)
    ),
  })
);

const checkBoxSpec = f.store(() =>
  createXmlSpec({
    label: syncers.xmlAttribute('label', 'skip'),
    // TEST: figure out how this works in sp6
    legacyIsEditable: pipe(
      syncers.xmlAttribute('initialize editable', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
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
    legacyDisplayType: pipe(
      syncers.xmlAttribute('dsptype', 'skip'),
      syncers.default(localized('list'))
    ),
    legacyRows: pipe(
      syncers.xmlAttribute('rows', 'skip'),
      syncers.maybe(syncers.toDecimal),
      syncers.default(15)
    ),
    legacyData: pipe(
      syncers.xmlAttribute('data', 'skip', false),
      syncers.maybe(syncers.fancySplit(','))
    ),
  })
);

const imageSpec = f.store(() =>
  createXmlSpec({
    size: pipe(
      syncers.xmlAttribute('initialize size', 'skip'),
      // Format: width,height in px
      syncers.default(localized('150,150')),
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
      syncers.default<boolean>(true)
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
      syncers.default<boolean>(false)
    ),
    legacyUseAlternateFilePicker: pipe(
      syncers.xmlAttribute('initialize forInput', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(true)
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

const pluginWrapperSpec = (
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
    definition: pipe(
      syncer(
        (node) => ({
          rest: syncers.captureLogContext<SimpleXmlNode>().serializer(node),
        }),
        ({ rest }) =>
          syncers.captureLogContext<SimpleXmlNode>().deserializer(rest)
      ),
      syncers.switch(
        'rest',
        'definition',
        syncers.xmlAttribute('initialize name', 'required'),
        {
          LatLonUI: 'LatLongUi',
          PartialDateUI: 'PartialDateUi',
          CollectionRelOneToManyPlugin: 'CollectionRelOneToManyPlugin',
          ColRelTypePlugin: 'ColRelTypePlugin',
          LocalityGeoRef: 'LocalityGeoRef',
          LocalityGoogleEarth: 'LeafletMap',
          WebLinkButton: 'WebLinkButton',
          AttachmentPlugin: 'AttachmentPlugin',
          HostTaxonPlugin: 'HostTaxonPlugin',
          PaleoMap: 'PaleoMap',
          ContainersColObjPlugin: 'ContainersColObjPlugin',
          TaxonLabelFormatting: 'TaxonLabelFormatting',
          ContainerPlugin: 'ContainerPlugin',
          // Google Earth Export plugin
          DefItemEditorPlugin: 'DefItemEditorPlugin',
          LocalityWorldWind: 'WorldWind',
          PasswordStrengthUI: 'PasswordStrengthUI',
        } as const,
        {
          LatLongUi: pluginSpec.latLong,
          PartialDateUi: pluginSpec.partialDate,
          CollectionRelOneToManyPlugin: pluginSpec.collectionRelOneToMany,
          ColRelTypePlugin: pluginSpec.colRelType,
          LocalityGeoRef: pluginSpec.localityGeoRef,
          LeafletMap: emptySpec,
          WebLinkButton: pluginSpec.webLink,
          AttachmentPlugin: emptySpec,
          HostTaxonPlugin: pluginSpec.hostTaxon,
          PaleoMap: emptySpec,
          ContainersColObjPlugin: emptySpec,
          TaxonLabelFormatting: emptySpec,
          ContainerPlugin: emptySpec,
          DefItemEditorPlugin: emptySpec,
          PasswordStrengthUI: emptySpec,
          WorldWind: emptySpec,
          Unknown: emptySpec,
        } as const,
        { field, cell, table }
      ),
      syncer(
        (node) => {
          const tables = pluginTables[node.definition.type];
          if (
            tables !== undefined &&
            table !== undefined &&
            !tables.includes(table.name)
          )
            console.error(
              `Can't display ${node.definition.rawType} on ${table.name} form. Instead, try ` +
                `displaying it on the ${formatDisjunction(
                  tables.map(localized)
                )} form`
            );
          return node;
        },
        (node) => node
      )
    ),
  });

const pluginTables: Partial<
  RR<
    SpecToJson<
      ReturnType<typeof pluginWrapperSpec>
    >['definition']['definition']['type'],
    RA<keyof Tables>
  >
> = {
  LatLongUi: ['Locality'],
  CollectionRelOneToManyPlugin: ['CollectionObject'],
  ColRelTypePlugin: ['CollectionObject'],
  LocalityGeoRef: ['Locality'],
  HostTaxonPlugin: ['CollectingEventAttribute'],
  LeafletMap: ['Locality'],
  PaleoMap: paleoPluginTables,
};

const pluginSpec = {
  latLong: () =>
    createXmlSpec({
      // Specify 7 only
      step: pipe(
        syncers.xmlAttribute('initialize step', 'skip'),
        syncers.maybe(syncers.toFloat)
      ),
      // Specify 7 only
      defaultType: pipe(
        syncers.xmlAttribute('initialize latLongType', 'skip'),
        syncers.maybe(syncers.enum(['Point', 'Line', 'Rectangle'] as const)),
        syncers.default('Point')
      ),
    }),
  partialDate: (
    _: unknown,
    { table }: { readonly table: SpecifyTable | undefined }
  ) =>
    createXmlSpec({
      dateField: pipe(
        syncers.xmlAttribute('initialize df', 'required'),
        syncers.maybe(syncers.field(table?.name))
      ),
      datePrecisionField: pipe(
        syncers.xmlAttribute('initialize tp', 'skip'),
        syncers.maybe(syncers.field(table?.name))
      ),
      // Specify 7 only
      defaultType: pipe(
        syncers.xmlAttribute('initialize defaultPrecision', 'skip'),
        syncers.maybe(syncers.enum(['year', 'month-year', 'full'] as const)),
        syncers.default('full')
      ),
      // Specify 7 only
      canChangePrecision: pipe(
        syncers.xmlAttribute('initialize canChangePrecision', 'skip'),
        syncers.maybe(syncers.toBoolean),
        syncers.default<boolean>(true)
      ),
    }),
  collectionRelOneToMany: () =>
    createXmlSpec({
      relationshipName: syncers.xmlAttribute('initialize relName', 'required'),
      /*
       * Specify 7 only
       * REFACTOR: this is redundant with "formatName". add a migration
       */
      dataObjectFormatter: syncers.xmlAttribute(
        'initialize formatting',
        'skip'
      ),
    }),
  colRelType: () =>
    createXmlSpec({
      relationshipName: syncers.xmlAttribute('initialize relName', 'required'),
      /*
       * Specify 7 only
       * REFACTOR: this is redundant with "formatName". add a migration
       */
      dataObjectFormatter: syncers.xmlAttribute(
        'initialize formatting',
        'skip'
      ),
      legacyForceRightSide: pipe(
        syncers.xmlAttribute('initialize forceRightSide', 'skip'),
        syncers.maybe(syncers.toBoolean),
        syncers.default<boolean>(false)
      ),
    }),
  localityGeoRef: () =>
    createXmlSpec({
      /*
       * If geography is not set, get the value from a field with
       * this ID instead
       */
      legacyGeographyId: syncers.xmlAttribute('initialize geoId', 'skip'),
      /*
       * If locality is not set, get the value from a field with
       * this ID instead
       */
      legacyLocalityId: syncers.xmlAttribute('initialize locId', 'skip'),
      /*
       * ID of the LatLongUI plugin. If set, precision and
       * latLongMethod will be updated after geo-referencing
       */
      legacyLatLongUiId: syncers.xmlAttribute('initialize llid', 'skip'),
    }),
  webLink: () =>
    createXmlSpec({
      webLinkName: syncers.xmlAttribute('initialize webLink', 'required'),
      icon: syncers.xmlAttribute('initialize icon', 'skip'),
    }),
  hostTaxon: () =>
    createXmlSpec({
      relationshipName: syncers.xmlAttribute('initialize relName', 'required'),
    }),
} as const;
/* eslint-enable @typescript-eslint/no-magic-numbers */

export const exportsForTests = {
  buildSpecifyProperties,
};
