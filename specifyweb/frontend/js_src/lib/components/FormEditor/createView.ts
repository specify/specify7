import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { getUniqueName } from '../../utils/uniquifyName';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import type { ViewDefinition } from '../FormParse';
import { fromSimpleXmlNode } from '../Syncer/fromSimpleXmlNode';
import { createSimpleXmlNode } from '../Syncer/xmlToJson';
import type { ViewSets } from './spec';

export const createViewDefinition = (
  viewSets: ViewSets,
  name: string,
  table: SpecifyTable,
  template: ViewDefinition | 'new'
): ViewSets =>
  template === 'new'
    ? createNewView(viewSets, name, table)
    : createViewFromTemplate(viewSets, name, table, template);

/**
 * Build a list of tables for which the "formTable" display type should be
 * enabled. This list is not a perfect optimization of what tables have a
 * "formTable" display option in sp6 out of the box, but it's good enough
 */
const tablesWithFormTable = f.store<RA<SpecifyTable>>(() =>
  Object.values(tables).filter(
    (table) => !table.isHidden && !table.overrides.isHidden && !table.isSystem
  )
);

type View = ViewSets['views'][number];
type Definition = ViewSets['viewDefs'][number];

function createNewView(
  viewSets: ViewSets,
  name: string,
  table: SpecifyTable
): ViewSets {
  const formName = getUniqueDefinitionName(name, viewSets);
  const formTableName = getUniqueDefinitionName(`${name} Table`, viewSets);
  const iconViewName = getUniqueDefinitionName(`${name} Icon`, viewSets);

  const hasFormTable = tablesWithFormTable().includes(table);
  const hasIconView = table.name.toLowerCase().includes('attachment');
  const altViewBase = {
    legacyTitle: undefined,
    legacyLabel: undefined,
    legacyValidated: false,
    legacySelectorValue: undefined,
  } as const;
  const getAltViews = (
    name: string,
    isDefault: boolean
  ): View['altViews']['altViews'] => [
    {
      name: `${name} View`,
      viewDef: name,
      mode: 'view',
      default: false,
      ...altViewBase,
    },
    {
      name: `${name} Edit`,
      viewDef: name,
      mode: 'edit',
      default: isDefault,
      ...altViewBase,
    },
  ];
  const altViews: View['altViews'] = {
    altViews: [
      ...getAltViews(formName, true),
      ...(hasFormTable ? getAltViews(formTableName, false) : []),
      ...(hasIconView ? getAltViews(iconViewName, false) : []),
    ],
    legacySelector: undefined,
    legacyDefaultMode: undefined,
  };
  const view: View = {
    name,
    title: table.name,
    description: '',
    table,
    legacyTable: undefined,
    altViews,
    legacyIsInternal: undefined,
    legacyIsExternal: undefined,
    legacyUseBusinessRules: true,
    legacyResourceLabels: undefined,
  };

  return {
    ...viewSets,
    views: [...viewSets.views, view],
    viewDefs: [
      ...viewSets.viewDefs,
      getFormView(formTableName, table),
      ...(hasIconView ? [getIconView(iconViewName, table)] : []),
      ...(hasFormTable
        ? [getTableView(formTableName, formTableName, table)]
        : []),
    ],
  };
}

const getIconView = (name: string, table: SpecifyTable): Definition => ({
  name,
  table,
  legacyTable: undefined,
  type: 'iconview',
  legacyGetTable: undefined,
  legacySetTable: undefined,
  legacyEditableDialog: true,
  legacyUseResourceLabels: undefined,
  /*
   * Not parsing the rest of the form definition but leaving it as is so
   * as not to slow down the performance too much for big files.
   * Instead, the contents of the form definition will validated by
   * formDefinitionSpec() later on
   */
  raw: fromSimpleXmlNode({
    ...createSimpleXmlNode('viewdef'),
    children: {
      desc: [
        {
          ...createSimpleXmlNode('desc'),
          text: 'The Attachments Icon Viewer',
        },
      ],
    },
  }),
});

const getTableView = (
  name: string,
  formName: string,
  table: SpecifyTable
): Definition => ({
  name,
  table,
  legacyTable: undefined,
  type: 'formtable',
  legacyGetTable: undefined,
  legacySetTable: undefined,
  legacyEditableDialog: true,
  legacyUseResourceLabels: undefined,
  /*
   * Not parsing the rest of the form definition but leaving it as is so
   * as not to slow down the performance too much for big files.
   * Instead, the contents of the form definition will validated by
   * formDefinitionSpec() later on
   */
  raw: fromSimpleXmlNode({
    ...createSimpleXmlNode('viewdef'),
    children: {
      desc: [
        {
          ...createSimpleXmlNode('desc'),
          text: `The ${table.name} Table`,
        },
      ],
      definition: [
        {
          ...createSimpleXmlNode('definition'),
          text: formName,
        },
      ],
    },
  }),
});

const getFormView = (name: string, table: SpecifyTable): Definition => ({
  name,
  table,
  legacyTable: undefined,
  type: 'form',
  legacyGetTable: undefined,
  legacySetTable: undefined,
  legacyEditableDialog: true,
  legacyUseResourceLabels: undefined,
  /*
   * Not parsing the rest of the form definition but leaving it as is so
   * as not to slow down the performance too much for big files.
   * Instead, the contents of the form definition will validated by
   * formDefinitionSpec() later on
   */
  raw: fromSimpleXmlNode({
    ...createSimpleXmlNode('viewdef'),
    children: {
      desc: [
        {
          ...createSimpleXmlNode('desc'),
          text: `The ${table.name} Table`,
        },
      ],
      enableRules: [{ ...createSimpleXmlNode('enableRules') }],
      columnDef: [
        {
          ...createSimpleXmlNode('columnDef'),
          text: `${'p,2px,'.repeat(5)}p,p:g`,
        },
      ],
      rowDef: [
        {
          ...createSimpleXmlNode('columnDef'),
          attributes: {
            auto: 'true',
            cell: 'p',
            sep: '2px',
          },
        },
      ],
      rows: [
        {
          ...createSimpleXmlNode('rows'),
          children: {
            row: [
              {
                ...createSimpleXmlNode('row'),
              },
            ],
          },
        },
      ],
    },
  }),
});

const getUniqueDefinitionName = (name: string, viewSets: ViewSets): string =>
  getUniqueName(
    name,
    viewSets.views.map((view) => view.name ?? '')
  );

function createViewFromTemplate(
  viewSets: ViewSets,
  name: string,
  table: SpecifyTable,
  template: ViewDefinition
): ViewSets {}

export const exportsForTests = {
  tablesWithFormTable,
};
