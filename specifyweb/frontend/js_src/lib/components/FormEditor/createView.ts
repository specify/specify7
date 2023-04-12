import { f } from '../../utils/functools';
import { tables } from '../DataModel/tables';
import { ViewSets } from './spec';
import { SpecifyTable } from '../DataModel/specifyTable';
import { ViewDefinition } from '../FormParse';

export const createViewDefinition = (
  viewSets: ViewSets,
  name: string,
  table: SpecifyTable,
  template: ViewDefinition | 'new'
): ViewSets =>
  /*
   * FIXME: consier how altview definitions should be handled
   * FIXME: generate formtable for tablesWithFormTable() if not already present
   * FIXME: generate iconview for all attachment tables
   * FIXME: make sure comments and unknowns are preserved
   */
  template === 'new'
    ? createNewView(viewSets, name, table)
    : createViewFromTemplate(viewSets, name, table, template);

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

function createNewView(
  viewSets: ViewSets,
  name: string,
  table: SpecifyTable
): ViewSets {
  const hasFormTable = tablesWithFormTable().includes(table.name);
  const hasIconView = table.name.toLowerCase().includes('attachment');
  const altViews: ViewSets['views'][number]['altViews'] = {
    altViews: [],
    legacySelector: undefined,
    legacyDefaultMode: undefined,
  };
  const view: ViewSets['views'][number] = {
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
}

function createViewFromTemplate(
  viewSets: ViewSets,
  name: string,
  table: SpecifyTable,
  template: ViewDefinition
): ViewSets {}

export const exportsForTests = {
  tablesWithFormTable,
};
