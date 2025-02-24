import { requireContext } from '../../../tests/helpers';
import { overwriteReadOnly } from '../../../utils/types';
import { schema } from '../../DataModel/schema';
import { tables } from '../../DataModel/tables';
import { getTablePermissions } from '../../Permissions';
import { tableNameToResourceName } from '../../Security/utils';
import { tablesFilter } from '../Tables';

requireContext();

describe('tablesFilter', () => {
  test('include all', () =>
    expect(tablesFilter(true, true, true, tables.WorkbenchRowImage)).toBe(
      true
    ));

  test('showHiddenTables excludes hidden and system', () =>
    expect(tablesFilter(false, true, true, tables.Institution)).toBe(true));

  test('showNoAccessTables excludes table without permission', () => {
    const tablePermissions =
      getTablePermissions()[schema.domainLevelIds.collection][
        tableNameToResourceName('AgentGeography')
      ];
    overwriteReadOnly(tablePermissions, 'read', false);
    expect(tablesFilter(true, false, true, tables.AgentGeography)).toBe(false);
    overwriteReadOnly(tablePermissions, 'read', true);
  });

  test('showAdvancedTables excludes non-common tables', () =>
    expect(tablesFilter(true, true, false, tables.AgentVariant)).toBe(false));

  test('selectedTables includes any selected table', () =>
    expect(
      tablesFilter(false, false, false, tables.GeographyTreeDefItem, [
        'GeographyTreeDefItem',
      ])
    ).toBe(true));
});
