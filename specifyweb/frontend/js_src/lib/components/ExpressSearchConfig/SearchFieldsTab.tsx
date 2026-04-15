import React from 'react';

import { expressSearchConfigText } from '../../localization/expressSearchConfig';
import { isSchemaFieldVisible } from '../../utils/schemaVisibility';
import { camelToHuman } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Input, Select } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { genericTables } from '../DataModel/tables';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { TableIcon } from '../Molecules/TableIcon';

/** Return the localized label for a field, falling back to camelToHuman. */
function fieldLabel(tableName: string, fieldName: string): string {
  return (
    (genericTables[tableName as keyof typeof genericTables]?.getField(fieldName)
      ?.label as string | undefined) ?? camelToHuman(fieldName)
  );
}

/** Return the localized label for a table, falling back to camelToHuman. */
function tableLabel(tableName: string): string {
  return (
    (genericTables[tableName as keyof typeof genericTables]?.label as
      | string
      | undefined) ?? camelToHuman(tableName)
  );
}

export function SearchFieldsTab({
  config,
  schemaMetadata,
  onChangeConfig,
}: any) {
  const [selectedTable, setSelectedTable] = React.useState<string | null>(null);

  // Default selection
  React.useEffect(() => {
    if (!selectedTable && schemaMetadata?.length > 0) {
      setSelectedTable(schemaMetadata[0].name);
    }
  }, [schemaMetadata, selectedTable]);

  if (!schemaMetadata || !config)
    return <div>{expressSearchConfigText.loadingMetadata()}</div>;

  const currentTableSchema = schemaMetadata.find(
    (t: any) => t.name === selectedTable
  );
  const currentTable = selectedTable
    ? genericTables[selectedTable as keyof typeof genericTables]
    : undefined;

  // Ensure table exists in config for rendering purposes
  let tableConfig = config.tables.find(
    (t: any) => t.tableName === selectedTable
  );
  if (!tableConfig && selectedTable) {
    tableConfig = {
      tableName: selectedTable,
      displayOrder: config.tables.length,
      searchFields: [],
      displayFields: [],
    };
  }

  const visibleDisplayFields = currentTable?.fields.filter((field: any) =>
    (() => {
      const schemaField = currentTable?.getField(field.name);
      const isToManyRelationship =
        schemaField?.isRelationship === true &&
        relationshipIsToMany(
          schemaField as Parameters<typeof relationshipIsToMany>[0]
        );
      const isVisibleInXml = tableConfig?.displayFields.some(
        (displayField: any) =>
          displayField.fieldName === field.name && displayField.inUse
      );
      const fieldExistsInSchema = currentTableSchema?.fields.some(
        (schemaField: any) => schemaField.name === field.name
      );
      return (
        fieldExistsInSchema && // Only show fields that actually exist in the schema
        (isVisibleInXml || // Make sure fields already in displayFields are always visible in the UI regardless of schema visibility settings
          (isSchemaFieldVisible(
            false,
            schemaField?.isHidden ?? false,
            field.name
          ) && // Only show non-hidden fields
            !isToManyRelationship)) // Exclude to-many relationships since they can't be displayed in search results currently
      );
    })()
  );

  const checkedDisplayFields =
    tableConfig?.displayFields.filter((field: any) => field.inUse !== false) ??
    [];
  const uncheckedDisplayFields =
    tableConfig?.displayFields.filter((field: any) => field.inUse === false) ??
    [];
  const configuredDisplayFieldNames = new Set(
    (tableConfig?.displayFields ?? []).map((field: any) => field.fieldName)
  );
  const unconfiguredDisplayFields =
    visibleDisplayFields?.filter(
      (field: any) => !configuredDisplayFieldNames.has(field.name)
    ) ?? [];

  const updateDisplayFields = (
    fieldName: string,
    isChecked: boolean,
    direction?: 'down' | 'up'
  ): void => {
    const newConfig = JSON.parse(JSON.stringify(config));
    const tConfig = newConfig.tables.find(
      (table: any) => table.tableName === selectedTable
    );
    if (!tConfig) return;

    const currentDisplayFields = tConfig.displayFields ?? [];
    const existingField = currentDisplayFields.find(
      (field: any) => field.fieldName === fieldName
    );

    if (direction !== undefined) {
      const checkedFields = currentDisplayFields.filter(
        (field: any) => field.inUse !== false
      );
      const uncheckedFields = currentDisplayFields.filter(
        (field: any) => field.inUse === false
      );
      const currentIndex = checkedFields.findIndex(
        (field: any) => field.fieldName === fieldName
      );
      if (currentIndex < 0) return;

      const targetIndex =
        direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= checkedFields.length) return;

      [checkedFields[currentIndex], checkedFields[targetIndex]] = [
        checkedFields[targetIndex],
        checkedFields[currentIndex],
      ];

      tConfig.displayFields = [...checkedFields, ...uncheckedFields];
    } else if (isChecked) {
      const checkedFields = currentDisplayFields.filter(
        (field: any) => field.inUse !== false && field.fieldName !== fieldName
      );
      const uncheckedFields = currentDisplayFields.filter(
        (field: any) => field.inUse === false && field.fieldName !== fieldName
      );
      const checkedEntry =
        existingField === undefined
          ? { fieldName, inUse: true }
          : { ...existingField, inUse: true };
      tConfig.displayFields = [
        ...checkedFields,
        checkedEntry,
        ...uncheckedFields,
      ];
    } else {
      const checkedFields = currentDisplayFields.filter(
        (field: any) => field.inUse !== false && field.fieldName !== fieldName
      );
      const uncheckedFields = currentDisplayFields.filter(
        (field: any) => field.inUse === false && field.fieldName !== fieldName
      );
      const uncheckedEntry =
        existingField === undefined
          ? { fieldName, inUse: false }
          : { ...existingField, inUse: false };
      tConfig.displayFields = [
        ...checkedFields,
        uncheckedEntry,
        ...uncheckedFields,
      ];
    }

    onChangeConfig(newConfig);
  };

  const handleSearchToggle = (fieldName: string, isChecked: boolean) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    let tConfig = newConfig.tables.find(
      (t: any) => t.tableName === selectedTable
    );
    if (!tConfig) {
      tConfig = {
        tableName: selectedTable,
        displayOrder: newConfig.tables.length,
        searchFields: [],
        displayFields: [],
      };
      newConfig.tables.push(tConfig);
    }

    const sf = tConfig.searchFields.find((f: any) => f.fieldName === fieldName);
    if (isChecked) {
      if (sf) {
        sf.inUse = true;
      } else {
        tConfig.searchFields.push({
          fieldName,
          inUse: true,
          order: tConfig.searchFields.length,
          sortDirection: 'None',
        });
      }
      // Auto-select corresponding display field
      const df = tConfig.displayFields.find(
        (f: any) => f.fieldName === fieldName
      );
      if (df) {
        df.inUse = true;
      } else {
        tConfig.displayFields.push({ fieldName, inUse: true });
      }
    } else {
      if (sf) {
        sf.inUse = false;
      }
      const df = tConfig.displayFields.find(
        (f: any) => f.fieldName === fieldName
      );
      if (df) {
        df.inUse = false;
      }
    }

    onChangeConfig(newConfig);
  };

  const handleDisplayToggle = (fieldName: string, isChecked: boolean) => {
    const sf = tableConfig?.searchFields.find(
      (f: any) => f.fieldName === fieldName
    );
    // Can't uncheck display if search is checked
    if (!isChecked && sf?.inUse) return;
    updateDisplayFields(fieldName, isChecked);
  };

  const moveDisplayField = (
    fieldName: string,
    direction: 'down' | 'up'
  ): void => {
    updateDisplayFields(fieldName, true, direction);
  };

  const handleSortChange = (fieldName: string, sortDirection: string) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    const tConfig = newConfig.tables.find(
      (t: any) => t.tableName === selectedTable
    );
    const sf = tConfig?.searchFields.find(
      (f: any) => f.fieldName === fieldName
    );
    if (sf) {
      sf.sortDirection = sortDirection;
    }
    onChangeConfig(newConfig);
  };

  return (
    <div className="flex flex-row gap-4 h-full min-h-[400px]">
      {/* Left panel: tables */}
      <div className="w-1/4 border rounded p-2 overflow-auto bg-gray-50 dark:bg-zinc-800">
        <h4 className="font-bold mb-2">
          {expressSearchConfigText.availableTables()}
        </h4>
        <ul className="space-y-1">
          {schemaMetadata.map((t: any) => (
            <li
              className={`cursor-pointer p-1 rounded ${selectedTable === t.name ? 'bg-brand-100 dark:bg-brand-400' : 'hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
              key={t.name}
              onClick={() => setSelectedTable(t.name)}
            >
              <div className="flex items-center gap-2">
                <TableIcon label={false} name={t.name} />
                <span>{tableLabel(t.name)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Middle panel: search fields */}
      <div className="w-2/4 border rounded p-2 overflow-auto">
        <h4 className="font-bold mb-2">
          {expressSearchConfigText.searchableFields()}
        </h4>
        {currentTableSchema && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-1">{expressSearchConfigText.searchLabel()}</th>
                <th className="p-1">{expressSearchConfigText.fieldName()}</th>
                <th className="p-1">{expressSearchConfigText.sortMode()}</th>
              </tr>
            </thead>
            <tbody>
              {currentTableSchema.fields
                .filter((f: any) => f.isIndexed)
                .map((f: any) => {
                  const sf = tableConfig?.searchFields.find(
                    (sf: any) => sf.fieldName === f.name
                  );
                  const inUse = sf?.inUse ?? sf !== undefined;
                  return (
                    <tr className="border-b" key={f.name}>
                      <td className="p-1 text-center">
                        <Input.Checkbox
                          checked={inUse}
                          onChange={(e) =>
                            handleSearchToggle(
                              f.name,
                              (e.target as HTMLInputElement).checked
                            )
                          }
                        />
                      </td>
                      <td className="p-1">
                        {fieldLabel(selectedTable!, f.name)}
                      </td>
                      <td className="p-1">
                        <Select
                          disabled={!inUse}
                          value={sf?.sortDirection ?? 'None'}
                          onChange={(e) =>
                            handleSortChange(f.name, e.target.value)
                          }
                        >
                          <option value="None">
                            {expressSearchConfigText.searchNone()}
                          </option>
                          <option value="Ascending">
                            {expressSearchConfigText.ascendingOrder()}
                          </option>
                          <option value="Descending">
                            {expressSearchConfigText.descendingOrder()}
                          </option>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>

      {/* Right panel: display fields */}
      <div className="w-1/4 border rounded p-2 overflow-auto">
        <h4 className="font-bold mb-2">
          {expressSearchConfigText.displayFields()}
        </h4>
        {currentTable && (
          <div className="space-y-3">
            <ul className="space-y-1">
              {checkedDisplayFields.map((f: any) => {
                const sf = tableConfig?.searchFields.find(
                  (sf: any) => sf.fieldName === f.fieldName
                );
                const isSearchInUse = sf?.inUse ?? sf !== undefined;
                const currentIndex = checkedDisplayFields.findIndex(
                  (field: any) => field.fieldName === f.fieldName
                );
                return (
                  <li
                    className="flex w-full items-center gap-2"
                    key={f.fieldName}
                  >
                    <Input.Checkbox
                      checked
                      disabled={isSearchInUse}
                      onChange={(e) =>
                        handleDisplayToggle(
                          f.fieldName,
                          (e.target as HTMLInputElement).checked
                        )
                      }
                    />
                    <span className="flex-1 min-w-0">
                      {fieldLabel(selectedTable!, f.fieldName)}
                    </span>
                    <div className="ml-auto flex shrink-0 gap-2">
                      <Button.BorderedGray
                        className="h-8 w-8 p-0"
                        disabled={currentIndex === 0}
                        onClick={(): void =>
                          moveDisplayField(f.fieldName, 'up')
                        }
                      >
                        {icons.chevronUp}
                      </Button.BorderedGray>
                      <Button.BorderedGray
                        className="h-8 w-8 p-0"
                        disabled={
                          currentIndex === checkedDisplayFields.length - 1
                        }
                        onClick={(): void =>
                          moveDisplayField(f.fieldName, 'down')
                        }
                      >
                        {icons.chevronDown}
                      </Button.BorderedGray>
                    </div>
                  </li>
                );
              })}
            </ul>

            <ul className="space-y-1 border-t pt-3">
              {uncheckedDisplayFields.map((f: any) => {
                const sf = tableConfig?.searchFields.find(
                  (sf: any) => sf.fieldName === f.fieldName
                );
                const isSearchInUse = sf?.inUse ?? sf !== undefined;
                return (
                  <li className="flex items-center gap-2" key={f.fieldName}>
                    <Input.Checkbox
                      checked={false}
                      disabled={isSearchInUse}
                      onChange={(e) =>
                        handleDisplayToggle(
                          f.fieldName,
                          (e.target as HTMLInputElement).checked
                        )
                      }
                    />
                    <span>{fieldLabel(selectedTable!, f.fieldName)}</span>
                  </li>
                );
              })}
              {unconfiguredDisplayFields.map((f: any) => {
                const sf = tableConfig?.searchFields.find(
                  (sf: any) => sf.fieldName === f.name
                );
                const isSearchInUse = sf?.inUse ?? sf !== undefined;
                return (
                  <li className="flex items-center gap-2" key={f.name}>
                    <Input.Checkbox
                      checked={false}
                      disabled={isSearchInUse}
                      onChange={(e) =>
                        handleDisplayToggle(
                          f.name,
                          (e.target as HTMLInputElement).checked
                        )
                      }
                    />
                    <span>{fieldLabel(selectedTable!, f.name)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
