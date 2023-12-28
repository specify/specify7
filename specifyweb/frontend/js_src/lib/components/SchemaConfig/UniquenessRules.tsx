import React from 'react';
import { useParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import {
  insertItem,
  removeItem,
  replaceItem,
  sortFunction,
  split,
} from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { addMissingFields } from '../DataModel/addMissingFields';
import type { SerializedResource } from '../DataModel/helperTypes';
import { schema, strictGetModel } from '../DataModel/schema';
import type { Relationship, RelationshipType } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
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
import { hasPermission } from '../Permissions/helpers';
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

  const model = React.useMemo(
    () => strictGetModel(container.name),
    [container]
  );

  const [tableRules = [], setTableRules, setStoredTableRules] =
    useTableUniquenessRules(model.name);

  const loading = React.useContext(LoadingContext);

  const [saveBlocked, setSavedBlocked] = React.useState(false);

  const [isEditing, _handleEditing, _disableEditing, toggleIsEditing] =
    useBooleanState();

  const [allItems = []] = useContainerItems(container, language, country);

  const allFieldNames = React.useMemo(
    () => Object.values(allItems).sort(sortFunction(({ name }) => name)),
    [allItems]
  );

  const [fields, relationships] = React.useMemo(() => {
    const [fields, rels] = split(
      [databaseScope, ...allFieldNames],
      (item) =>
        item.name === databaseFieldName ||
        model.getField(item.name)!.isRelationship
    );
    return [
      fields,
      rels.filter(
        (relationship) =>
          relationship.name === databaseFieldName ||
          !(['one-to-many', 'many-to-many'] as RA<RelationshipType>).includes(
            (model.getRelationship(relationship.name)?.type ??
              '') as RelationshipType
          )
      ),
    ];
  }, [allFieldNames, model]);

  React.useEffect(() => {
    setSavedBlocked(
      tableRules
        .filter(({ duplicates }) => duplicates !== undefined)
        .some(({ duplicates }) => duplicates!.totalDuplicates > 0)
    );
  }, [tableRules]);

  const handleRuleValidation = React.useCallback(
    (newRule: UniquenessRule, index: number) => {
      const filteredRule: UniquenessRule = {
        ...newRule,
        fields: newRule.fields.filter(
          (field, index) =>
            newRule.fields.map(({ name }) => name).indexOf(field.name) === index
        ),
        scopes: newRule.scopes.filter(
          (scope, index) =>
            newRule.scopes.map(({ name }) => name).indexOf(scope.name) === index
        ),
      };
      loading(
        validateUniqueness(
          container.name as keyof Tables,
          filteredRule.fields
            .filter((field) => field.name !== '')
            .map((field) => field.name) as unknown as RA<never>,
          filteredRule.scopes
            .filter(({ name }) => name !== databaseFieldName)
            .map(({ name }) => name) as unknown as RA<never>
        ).then((data) => {
          const isNewRule = index > tableRules.length;
          setTableRules((previous) =>
            isNewRule
              ? [...previous!, { rule: filteredRule, duplicates: data }]
              : replaceItem(tableRules, index, {
                  rule: filteredRule,
                  duplicates: data,
                })
          );

          return filteredRule;
        })
      );
    },
    [container.name, loading, tableRules, setTableRules]
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
                      method: tableRules.some(({ rule }) => rule.id === null)
                        ? 'POST'
                        : 'PUT',
                      body: {
                        rules: tableRules.map(({ rule }) => rule),
                        model: container.name,
                      },
                    }
                  ).then((): void => {
                    setStoredTableRules(tableRules);
                    return isEditing
                      ? void toggleIsEditing()
                      : void handleClose();
                  })
                );
              }}
            >
              {commonText.save()}
            </Submit.Save>
          )}
        </>
      }
      header={header}
      headerButtons={
        <>
          <span className="-ml-2 flex-1" />
          <Button.Small
            aria-pressed={isEditing}
            className="w-fit"
            disabled={!hasPermission('/schemaconfig/uniquenessrules', 'update')}
            onClick={toggleIsEditing}
          >
            {commonText.edit()}
          </Button.Small>
        </>
      }
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
        {tableRules?.map(({ rule, duplicates }, index) => (
          <UniquenessRuleRow
            fetchedDuplicates={duplicates}
            fields={fields}
            isEditing={isEditing}
            key={index}
            label={getUniqueInvalidReason(
              rule.scopes.map(
                (scope) => (model.getField(scope.name) ?? '') as Relationship
              ),
              filterArray(
                rule.fields.map((field) => model.getField(field.name))
              )
            )}
            model={model}
            relationships={relationships}
            rule={rule}
            onChange={(newRule): void => handleRuleValidation(newRule, index)}
            onRemoved={(): void => setTableRules(removeItem(tableRules, index))}
          />
        ))}
      </table>
      {isEditing && (
        <Button.Small
          className="w-fit"
          disabled={!hasPermission('/schemaconfig/uniquenessrules', 'create')}
          onClick={(): void =>
            handleRuleValidation(
              {
                id: null,
                fields: [fields[0]],
                isDatabaseConstraint: false,
                scopes: [],
              },
              tableRules.length
            )
          }
        >
          {schemaText.addUniquenessRule()}
        </Button.Small>
      )}
    </Dialog>
  );
}

function UniquenessRuleRow({
  rule,
  model,
  label,
  fields,
  relationships,
  fetchedDuplicates,
  isEditing,
  onChange: handleChanged,
  onRemoved: handleRemoved,
}: {
  readonly rule: UniquenessRule;
  readonly model: SpecifyModel;
  readonly label: string;
  readonly fields: RA<
    SerializedResource<SpLocaleContainerItem> & WithFetchedStrings
  >;
  readonly relationships: RA<
    SerializedResource<SpLocaleContainerItem> & WithFetchedStrings
  >;
  readonly fetchedDuplicates: UniquenessRuleValidation | undefined;
  readonly isEditing: boolean;
  readonly onChange: (newRule: typeof rule) => void;
  readonly onRemoved: () => void;
}): JSX.Element {
  const readOnly = React.useMemo(
    () =>
      rule.isDatabaseConstraint ||
      !hasPermission('/schemaconfig/uniquenessrules', 'update'),
    [rule.isDatabaseConstraint]
  );

  const [
    isModifyingRule,
    _setModifyingRule,
    _setNotModifyingRule,
    toggleModifyingRule,
  ] = useBooleanState();

  return (
    <tr title={label}>
      <td>
        {!isEditing || readOnly ? null : (
          <Button.Small
            aria-selected={isModifyingRule}
            className="w-fit"
            onClick={toggleModifyingRule}
          >
            {icons.pencil}
          </Button.Small>
        )}
        {rule.fields.map((field, index) => (
          <Input.Text
            disabled
            key={index}
            value={
              (
                fields.find(({ name }) => name === field.name) ??
                relationships.find(({ name }) => name === field.name)
              )?.strings.name.text
            }
          />
        ))}
      </td>
      <td>
        <Input.Text
          disabled
          value={
            rule.scopes.length === 0
              ? databaseScope.strings.name.text
              : relationships.find(({ name }) => name === rule.scopes[0]?.name)
                  ?.strings.name.text
          }
        />
        {isModifyingRule && (
          <ModifyUniquenessRule
            fetchedDuplicates={fetchedDuplicates}
            fields={fields}
            label={label}
            model={model}
            readOnly={readOnly}
            relationships={relationships}
            rule={rule}
            onChange={handleChanged}
            onClose={toggleModifyingRule}
            onRemoved={handleRemoved}
          />
        )}
        {fetchedDuplicates !== undefined &&
          fetchedDuplicates.totalDuplicates > 0 && (
            <Button.Icon
              icon="exclamation"
              title=""
              onClick={toggleModifyingRule}
            />
          )}
      </td>
    </tr>
  );
}

function ModifyUniquenessRule({
  rule,
  model,
  readOnly,
  label,
  fields,
  relationships,
  fetchedDuplicates,
  onChange: handleChanged,
  onRemoved: handleRemoved,
  onClose: handleClose,
}: {
  readonly rule: UniquenessRule;
  readonly model: SpecifyModel;
  readonly readOnly: boolean;
  readonly label: string;
  readonly fields: RA<
    SerializedResource<SpLocaleContainerItem> & WithFetchedStrings
  >;
  readonly relationships: RA<
    SerializedResource<SpLocaleContainerItem> & WithFetchedStrings
  >;
  readonly fetchedDuplicates: UniquenessRuleValidation | undefined;
  readonly onChange: (newRule: typeof rule) => void;
  readonly onRemoved: () => void;
  readonly onClose: () => void;
}): JSX.Element {
  const [separator] = userPreferences.use(
    'queryBuilder',
    'behavior',
    'exportFileDelimiter'
  );

  const uniqueFields = React.useMemo(
    () =>
      [...fields, ...relationships].map(
        (item) => [item.name, item.strings.name.text] as const
      ),
    [fields, relationships]
  );

  const [advancedScopes, hierarchyScopes] = React.useMemo(
    () =>
      split(relationships, (field) =>
        field.name === databaseFieldName
          ? true
          : schema.orgHierarchy.includes(
              (model.getRelationship(field.name)?.getReverse()?.model.name ??
                '') as typeof schema.orgHierarchy[number]
            )
      ).map((scopes) =>
        scopes.map((field) => [field.name, field.strings.name.text] as const)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [relationships]
  );

  return (
    <Dialog
      buttons={
        <>
          <Button.Danger
            disabled={!hasPermission('/schemaconfig/uniquenessrules', 'delete')}
            onClick={(): void => {
              handleRemoved();
              handleClose();
            }}
          >
            {commonText.delete()}
          </Button.Danger>
          <span className="-ml-2 flex-1" />
          {fetchedDuplicates !== undefined &&
            fetchedDuplicates.totalDuplicates > 0 && (
              <Button.Danger
                onClick={(): void => {
                  const fileName = `${model.name} ${rule.fields
                    .map((field) => field.name)
                    .toString()}-in_${rule.scopes[0]?.name}.csv`;

                  const columns = Object.entries(
                    fetchedDuplicates.fields[0]
                  ).map(([fieldName, _]) =>
                    fieldName === 'duplicates' ? 'Duplicate Values' : fieldName
                  );
                  const rows = fetchedDuplicates.fields.map((duplicate) =>
                    Object.entries(duplicate).map(([_, value]) =>
                      value.toString()
                    )
                  );

                  downloadDataSet(fileName, rows, columns, separator).catch(
                    raise
                  );
                }}
              >
                {schemaText.exportDuplicates()}
              </Button.Danger>
            )}
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        </>
      }
      header={label}
      icon={icons.pencilAt}
      modal
      onClose={handleClose}
    >
      <>
        <p>{schemaText.uniqueFields()}</p>
        {rule.fields.map((field, index) => (
          <div className="inline-flex" key={index}>
            <PickList
              disabled={readOnly}
              groups={{
                [schemaText.fields()]: uniqueFields,
              }}
              key={field.id}
              value={field.name}
              onChange={(value): void => {
                const newField = defined(
                  fields.find(({ name }) => name === value) ??
                    relationships.find(({ name }) => name === value),
                  `Splocalecontainer item with name ${value ?? ''} not defined`
                );
                handleChanged({
                  ...rule,
                  fields: replaceItem(rule.fields, index, newField),
                });
              }}
            />
            {rule.fields.length > 1 && (
              <Button.Icon
                className={`w-fit ${className.dataEntryRemove}`}
                disabled={readOnly}
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
          </div>
        ))}
        <Button.BorderedGray
          className="w-fit"
          disabled={readOnly}
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
        >
          {commonText.add()}
        </Button.BorderedGray>
        <p>{schemaText.scope()}</p>
        <PickList
          disabled={readOnly}
          groups={{
            [schemaText.hierarchyScopes()]: hierarchyScopes,
            [schemaText.advancedScopes()]: advancedScopes,
          }}
          value={
            rule.scopes.length === 0 ? databaseFieldName : rule.scopes[0]?.name
          }
          onChange={(value): void => {
            const newScope =
              value === null
                ? databaseScope
                : relationships.find(({ name }) => name === value);
            handleChanged({
              ...rule,
              scopes:
                newScope === databaseScope
                  ? []
                  : [newScope as SerializedResource<SpLocaleContainerItem>],
            });
          }}
        />
      </>
    </Dialog>
  );
}
