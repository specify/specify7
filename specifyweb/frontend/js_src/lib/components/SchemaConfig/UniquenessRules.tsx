import React from 'react';
import { useParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { defined, filterArray, localized } from '../../utils/types';
import {
  insertItem,
  removeItem,
  removeKey,
  replaceItem,
  sortFunction,
  split,
} from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { addMissingFields } from '../DataModel/addMissingFields';
import type { SerializedResource } from '../DataModel/helperTypes';
import { schema } from '../DataModel/schema';
import type { RelationshipType } from '../DataModel/specifyField';
import { getTable, strictGetTable } from '../DataModel/tables';
import type {
  SpLocaleContainer,
  SpLocaleContainerItem,
  Tables,
} from '../DataModel/types';
import type {
  UniquenessRule,
  UniquenessRuleValidation,
} from '../DataModel/uniquenessRules';
import {
  databaseFieldName,
  databaseScope,
  getUniqueInvalidReason,
  useTableUniquenessRules,
  validateUniqueness,
} from '../DataModel/uniquenessRules';
import { raise } from '../Errors/Crash';
import { Dialog } from '../Molecules/Dialog';
import { userPreferences } from '../Preferences/userPreferences';
import type { WithFetchedStrings } from '../Toolbar/SchemaConfig';
import { downloadDataSet } from '../WorkBench/helpers';
import { PickList } from './Components';
import { useContainerItems } from './Hooks';

export function TableUniquenessRules({
  container,
  header,
  onClose: handleClose,
}: {
  readonly container: SerializedResource<SpLocaleContainer>;
  readonly header: LocalizedString;
  readonly onClose: () => void;
}): JSX.Element {
  const { language: rawLanguage = '' } = useParams();
  const [language, country = null] = rawLanguage.split('-');

  const [tableRules = [], setTableRules, setCachedTableRules, uniqueIdRef] =
    useTableUniquenessRules(strictGetTable(container.name).name);

  const loading = React.useContext(LoadingContext);

  const [saveBlocked, setSavedBlocked] = React.useState(false);

  const [fetchedDuplicates, setFetchedDuplicates] = React.useState<
    Record<number, UniquenessRuleValidation>
  >({});

  const [isRuleExpanded, setRuleExpanded] = React.useState<
    Record<number, boolean>
  >({});

  const [items = []] = useContainerItems(container, language, country);

  const [fields = [], relationships = []] = React.useMemo(() => {
    const sortedItems = Object.values(items).sort(
      sortFunction(({ name }) => name)
    );

    const [fields, rels] = split(
      sortedItems,
      (item) => getTable(container.name)!.getField(item.name)!.isRelationship
    );
    return [
      fields,
      rels.filter(
        (relationship) =>
          !(['one-to-many', 'many-to-many'] as RA<RelationshipType>).includes(
            getTable(container.name)?.getRelationship(relationship.name)
              ?.type ?? ('' as RelationshipType)
          )
      ),
    ];
  }, [items, container.name]);

  React.useEffect(() => {
    setSavedBlocked(
      Object.entries(fetchedDuplicates).some(
        ([_, validationResults]) => validationResults.totalDuplicates > 0
      )
    );
  }, [fetchedDuplicates]);

  const handleRuleValidation = React.useCallback(
    (newRule: UniquenessRule) =>
      loading(
        validateUniqueness(
          container.name as keyof Tables,
          newRule.fields
            .filter((field) => field.name !== '')
            .map((field) => field.name) as unknown as RA<never>,
          newRule.scope
            .filter(({ name }) => name !== databaseFieldName)
            .map(({ name }) => name) as unknown as RA<never>
        ).then((data) => {
          const isNewRule = newRule.uniqueId === undefined;
          if (isNewRule) uniqueIdRef.current += 1;

          const ruleWithUniqueId: typeof newRule = isNewRule
            ? { ...newRule, uniqueId: uniqueIdRef.current + 1 }
            : newRule;

          setFetchedDuplicates((previousDuplicates) => ({
            ...previousDuplicates,
            [ruleWithUniqueId.uniqueId!]: data,
          }));
          setTableRules((previous) => {
            const ruleIndex = previous!.findIndex(
              (rule) => rule.uniqueId === ruleWithUniqueId.uniqueId
            );

            return isNewRule
              ? [...previous!, ruleWithUniqueId]
              : replaceItem(tableRules, ruleIndex, newRule);
          });

          return newRule;
        })
      ),
    [container.name, loading, tableRules, setTableRules, uniqueIdRef]
  );

  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          {saveBlocked ? (
            <Button.Danger
              className="cursor-not-allowed"
              onClick={(): void => undefined}
            >
              {icons.exclamation}
              {commonText.save()}
            </Button.Danger>
          ) : (
            <Submit.Save
              onClick={(): void => {
                loading(
                  ajax(
                    `/businessrules/uniqueness_rules/${schema.domainLevelIds.discipline}/`,
                    {
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      headers: { Accept: 'application/json' },
                      method: 'POST',
                      body: {
                        rules: tableRules,
                      },
                    }
                  ).then((): void => {
                    setCachedTableRules(tableRules);
                    return void handleClose();
                  })
                );
              }}
            >
              {commonText.save()}
            </Submit.Save>
          )}
        </>
      }
      header={localized(header)}
      modal={false}
      onClose={handleClose}
    >
      <table className="grid-table grid-cols-[2fr_1fr] gap-2 gap-y-4 overflow-auto ">
        <thead>
          <tr>
            <td>{schemaText.uniqueFields()}</td>
            <td>{schemaText.scope()}</td>
          </tr>
        </thead>
        {tableRules?.map((rule, index) => (
          <UniquenessRuleRow
            container={container}
            fetchedDuplicates={fetchedDuplicates[rule.uniqueId!] ?? []}
            fields={[...fields, ...relationships]}
            isExpanded={isRuleExpanded[rule.uniqueId!]}
            key={rule.uniqueId}
            label={getUniqueInvalidReason(
              getTable(container.name)?.getField(rule.scope[0]?.name ?? ''),
              filterArray(
                rule.fields.map((field) =>
                  getTable(container.name)?.getField(field.name)
                )
              )
            )}
            relationships={[databaseScope, ...relationships]}
            rule={rule}
            onChange={handleRuleValidation}
            onExpanded={(): void =>
              setRuleExpanded({
                ...isRuleExpanded,
                [rule.uniqueId!]: !isRuleExpanded[rule.uniqueId!],
              })
            }
            onRemoved={(): void => {
              setTableRules(removeItem(tableRules, index));
              setFetchedDuplicates((previousDuplicates) =>
                removeKey(previousDuplicates, rule.uniqueId!.toString())
              );
              setRuleExpanded((previousExpanded) =>
                removeKey(previousExpanded, rule.uniqueId!)
              );
            }}
          />
        ))}
      </table>
      <Button.Small
        className="w-fit"
        onClick={(): void =>
          handleRuleValidation({
            id: null,
            fields: [fields[0]],
            isDatabaseConstraint: false,
            scope: [],
          })
        }
      >
        {schemaText.addUniquenessRule()}
      </Button.Small>
    </Dialog>
  );
}

function UniquenessRuleRow({
  rule,
  container,
  label,
  fields,
  relationships,
  isExpanded,
  fetchedDuplicates,
  onChange: handleChanged,
  onExpanded: handleExpanded,
  onRemoved: handleRemoved,
}: {
  readonly rule: UniquenessRule;
  readonly container: SerializedResource<SpLocaleContainer>;
  readonly label: string;
  readonly fields: RA<
    SerializedResource<SpLocaleContainerItem> & WithFetchedStrings
  >;
  readonly relationships: RA<
    SerializedResource<SpLocaleContainerItem> & WithFetchedStrings
  >;
  readonly isExpanded: boolean;
  readonly fetchedDuplicates: UniquenessRuleValidation;
  readonly onChange: (newRule: typeof rule) => void;
  readonly onExpanded: () => void;
  readonly onRemoved: () => void;
}): JSX.Element {
  const readOnly = rule.isDatabaseConstraint;
  const [separator] = userPreferences.use(
    'queryBuilder',
    'behavior',
    'exportFileDelimiter'
  );
  return (
    <tr title={isExpanded ? '' : label}>
      <td>
        {readOnly ? null : (
          <Button.Small className="w-fit" onClick={handleExpanded}>
            {isExpanded ? icons.chevronDown : icons.chevronRight}
          </Button.Small>
        )}
        {rule.fields.map((field, index) => (
          <>
            <PickList
              className={isExpanded ? 'w-fit' : ''}
              disabled={readOnly}
              groups={{
                [schemaText.fields()]: fields.map((field) => [
                  field.name,
                  field.strings.name.text,
                ]) as RA<readonly [string, string]>,
                [schemaText.relationships()]: relationships
                  .filter((field) => field.name !== databaseFieldName)
                  .map((field) => [field.name, field.strings.name.text]) as RA<
                  readonly [string, string]
                >,
              }}
              value={field.name}
              onChange={(value): void => {
                const newField = defined(
                  fields.find(({ name }) => name === value),
                  `Splocalecontaineritem with name ${value ?? ''} not defined`
                );
                handleChanged({
                  ...rule,
                  fields: replaceItem(rule.fields, index, newField),
                });
              }}
            />
            {isExpanded && rule.fields.length > 1 && (
              <Button.Icon
                className={`w-fit ${className.dataEntryRemove}`}
                icon="minus"
                title={commonText.remove()}
                onClick={(): void =>
                  handleChanged({
                    ...rule,
                    fields: removeItem(rule.fields, index),
                  })
                }
              />
            )}
          </>
        ))}
        {isExpanded && (
          <Button.Icon
            className={`w-fit ${className.dataEntryAdd}`}
            icon="plus"
            title={commonText.add()}
            onClick={(): void =>
              handleChanged({
                ...rule,
                fields: insertItem(
                  rule.fields,
                  rule.fields.length,
                  addMissingFields('SpLocaleContainerItem', {})
                ),
              })
            }
          />
        )}
      </td>
      <td>
        <PickList
          className={isExpanded ? 'w-fit' : ''}
          disabled={readOnly}
          groups={{
            [schemaText.hierarchyScopes()]: relationships
              .filter((field) =>
                field.name === databaseFieldName
                  ? true
                  : schema.orgHierarchy.includes(
                      (strictGetTable(container.name)
                        .getRelationship(field.name)
                        ?.getReverse()?.table.name ??
                        '') as typeof schema.orgHierarchy[number]
                    )
              )
              .map((field) => [field.name, field.strings.name.text]) as RA<
              readonly [string, string]
            >,
            [schemaText.advancedScopes()]: relationships
              .filter((field) =>
                field.name === databaseFieldName
                  ? false
                  : !schema.orgHierarchy.includes(
                      (strictGetTable(container.name)
                        .getRelationship(field.name)
                        ?.getReverse()?.table.name ??
                        '') as typeof schema.orgHierarchy[number]
                    )
              )
              .map((field) => [field.name, field.strings.name.text]) as RA<
              readonly [string, string]
            >,
          }}
          value={rule.scope[0]?.name}
          onChange={(value): void => {
            const newScope =
              value === null
                ? databaseScope
                : relationships.find(({ name }) => name === value);
            handleChanged({
              ...rule,
              scope: [newScope as SerializedResource<SpLocaleContainerItem>],
            });
          }}
        />
        {isExpanded && (
          <Button.Icon
            className="w-fit"
            icon="trash"
            title={commonText.remove()}
            onClick={handleRemoved}
          />
        )}
        {fetchedDuplicates.totalDuplicates > 0 && (
          <Button.Danger
            onClick={(): void => {
              const fileName = `${container.name} ${rule.fields
                .map((field) => field.name)
                .toString()}-in_${rule.scope[0]?.name}.csv`;

              const columns = Object.entries(fetchedDuplicates.fields[0]).map(
                ([fieldName, _]) =>
                  fieldName === 'duplicates' ? 'Duplicate Values' : fieldName
              );
              const rows = fetchedDuplicates.fields.map((duplicate) =>
                Object.entries(duplicate).map(([_, value]) => value.toString())
              );

              downloadDataSet(fileName, rows, columns, separator).catch(raise);
            }}
          >
            {schemaText.exportDuplicates()}
          </Button.Danger>
        )}
      </td>
    </tr>
  );
}
