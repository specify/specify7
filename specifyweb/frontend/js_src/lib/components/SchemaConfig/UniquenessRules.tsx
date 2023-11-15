import React from 'react';
import { useParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { defined, filterArray, localized } from '../../utils/types';
import { removeKey, sortFunction, split } from '../../utils/utils';
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
  getUniqueInvalidReason,
  useModelUniquenessRules,
  validateUniqueness,
} from '../DataModel/uniquenessRules';
import { raise } from '../Errors/Crash';
import { Dialog } from '../Molecules/Dialog';
import { userPreferences } from '../Preferences/userPreferences';
import type { WithFetchedStrings } from '../Toolbar/SchemaConfig';
import { downloadDataSet } from '../WorkBench/helpers';
import { PickList } from './Components';
import { useContainerItems } from './Hooks';

const databaseFieldName = '_database';
const databaseResourceUri = '/_database';
const dataBaseScope: SerializedResource<SpLocaleContainerItem> &
  WithFetchedStrings = {
  resource_uri: databaseResourceUri,
  name: databaseFieldName,
  strings: { name: { text: schemaText.database() } },
};

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

  const [modelRules = [], setModelRules, setCachedModelRules, uniqueIdRef] =
    useModelUniquenessRules(container.name as keyof Tables);

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
    (newRule: UniquenessRule) => {
      loading(
        Promise.resolve(
          validateUniqueness(
            container.name as keyof Tables,
            newRule.fields
              .filter((field) => field.name !== '')
              .map((field) => field.name) as unknown as RA<never>,
            newRule.scope === null ||
              newRule.scope === undefined ||
              newRule.scope.name === databaseFieldName
              ? undefined
              : (newRule.scope.name as unknown as undefined)
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
            setModelRules((previous) => {
              const ruleIndex = previous!.findIndex(
                (rule) => rule.uniqueId === ruleWithUniqueId.uniqueId
              );

              return isNewRule
                ? [...previous!, ruleWithUniqueId]
                : [
                    ...modelRules.slice(0, ruleIndex),
                    newRule,
                    ...modelRules.slice(ruleIndex + 1, modelRules.length),
                  ];
            });

            return newRule;
          })
        )
      );
    },
    [container.name, loading, modelRules, setModelRules, uniqueIdRef]
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
                        rules: modelRules,
                      },
                    }
                  ).then((): void => {
                    setCachedModelRules(modelRules);
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
        {modelRules?.map((rule, index) => (
          <UniquenessRuleRow
            container={container}
            fetchedDuplicates={fetchedDuplicates[rule.uniqueId!] ?? []}
            fields={fields}
            isExpanded={isRuleExpanded[rule.uniqueId!]}
            key={rule.uniqueId}
            label={getUniqueInvalidReason(
              getTable(container.name)?.getField(rule.scope?.name ?? ''),
              filterArray(
                rule.fields.map((field) =>
                  getTable(container.name)?.getField(field.name)
                )
              )
            )}
            relationships={[dataBaseScope, ...relationships]}
            rule={rule}
            onChange={handleRuleValidation}
            onExpanded={(): void =>
              setRuleExpanded({
                ...isRuleExpanded,
                [rule.uniqueId!]: !isRuleExpanded[rule.uniqueId!],
              })
            }
            onRemoved={(): void => {
              setModelRules([
                ...modelRules.slice(0, index),
                ...modelRules.slice(index + 1, modelRules.length),
              ]);
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
        onClick={(): void => {
          const newRule: UniquenessRule = {
            id: null,
            fields: [fields[0]],
            isDatabaseConstraint: false,
            scope: null,
          };
          handleRuleValidation(newRule);
        }}
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
  const disableRuleModification = rule.isDatabaseConstraint;
  const [separator] = userPreferences.use(
    'queryBuilder',
    'behavior',
    'exportFileDelimiter'
  );
  return (
    <tr title={isExpanded ? '' : label}>
      <td>
        {disableRuleModification ? null : (
          <Button.Small className="w-fit" onClick={handleExpanded}>
            {isExpanded ? icons.chevronDown : icons.chevronRight}
          </Button.Small>
        )}
        {rule.fields.map((field, index) => (
          <>
            <PickList
              className={isExpanded ? 'w-fit' : ''}
              disabled={disableRuleModification}
              groups={{
                '': fields.map((field) => [
                  field.resource_uri,
                  field.strings.name.text,
                ]) as RA<readonly [string, string]>,
              }}
              value={field.resource_uri}
              onChange={(value): void => {
                const newField = defined(
                  fields.at(
                    fields.findIndex(
                      ({ resource_uri }) => resource_uri === value
                    )
                  ),
                  `Splocalecontaineritem with resource_uri ${
                    value ?? ''
                  } not defined`
                );
                handleChanged({
                  ...rule,
                  fields: [
                    ...rule.fields.slice(0, index),
                    newField,
                    ...rule.fields.slice(index + 1, fields.length),
                  ],
                });
              }}
            />
            {isExpanded && rule.fields.length > 1 ? (
              <Button.Icon
                className={`w-fit ${className.dataEntryRemove}`}
                icon="minus"
                title={commonText.remove()}
                onClick={(): void =>
                  handleChanged({
                    ...rule,
                    fields: [
                      ...rule.fields.slice(0, index),
                      ...rule.fields.slice(index + 1, rule.fields.length),
                    ],
                  })
                }
              />
            ) : null}
          </>
        ))}
        {isExpanded ? (
          <Button.Icon
            className={`w-fit ${className.dataEntryAdd}`}
            icon="plus"
            title={commonText.add()}
            onClick={(): void =>
              handleChanged({
                ...rule,
                fields: [
                  ...rule.fields,
                  addMissingFields('SpLocaleContainerItem', {}),
                ],
              })
            }
          />
        ) : null}
      </td>
      <td>
        <PickList
          className={isExpanded ? 'w-fit' : ''}
          disabled={disableRuleModification}
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
              .map((field) => [
                field.resource_uri,
                field.strings.name.text,
              ]) as RA<readonly [string, string]>,
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
              .map((field) => [
                field.resource_uri,
                field.strings.name.text,
              ]) as RA<readonly [string, string]>,
          }}
          value={rule.scope === null ? null : rule.scope.resource_uri}
          onChange={(value): void => {
            const newScope =
              value === null
                ? null
                : relationships.at(
                    relationships.findIndex(
                      ({ resource_uri }) => resource_uri === value
                    )
                  );
            handleChanged({
              ...rule,
              scope: newScope as SerializedResource<SpLocaleContainerItem>,
            });
          }}
        />
        {isExpanded ? (
          <Button.Icon
            className="w-fit"
            icon="trash"
            title={commonText.remove()}
            onClick={handleRemoved}
          />
        ) : null}
        {fetchedDuplicates.totalDuplicates > 0 ? (
          <Button.Danger
            onClick={(): void => {
              const fileName = `${container.name} ${rule.fields
                .map((field) => field.name)
                .toString()}-in_${
                rule.scope === null ? schemaText.database() : rule.scope.name
              }.csv`;

              const columns = Object.entries(fetchedDuplicates.fields[0]).map(
                ([fieldName, _]) =>
                  fieldName === '_duplicates' ? 'Duplicates Values' : fieldName
              );
              const rows = fetchedDuplicates.fields.map((duplicate) =>
                Object.entries(duplicate).map(([_, value]) => value.toString())
              );

              downloadDataSet(fileName, rows, columns, separator).catch(raise);
            }}
          >
            {schemaText.exportDuplicates()}
          </Button.Danger>
        ) : null}
      </td>
    </tr>
  );
}
