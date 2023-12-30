import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { insertItem, removeItem, replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { getFieldsFromPath } from '../DataModel/businessRules';
import type { SerializedResource } from '../DataModel/helperTypes';
import { schema, strictGetModel } from '../DataModel/schema';
import type {
  LiteralField,
  Relationship,
  RelationshipType,
} from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { SpLocaleContainer, Tables } from '../DataModel/types';
import type {
  UniquenessRule,
  UniquenessRuleValidation,
} from '../DataModel/uniquenessRules';
import {
  getUniqueInvalidReason,
  useTableUniquenessRules,
  validateUniqueness,
} from '../DataModel/uniquenessRules';
import { raise } from '../Errors/Crash';
import { Dialog } from '../Molecules/Dialog';
import { hasPermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import type { HtmlGeneratorFieldData } from '../WbPlanView/LineComponents';
import { getMappingLineProps } from '../WbPlanView/LineComponents';
import { MappingView } from '../WbPlanView/MapperComponents';
import type { MappingLineData } from '../WbPlanView/navigator';
import { downloadDataSet } from '../WorkBench/helpers';
import { PickList } from './Components';

export function TableUniquenessRules({
  container,
  header,
  onClose: handleClose,
}: {
  readonly container: SerializedResource<SpLocaleContainer>;
  readonly header: LocalizedString;
  readonly onClose: () => void;
}): JSX.Element {
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

  const fields = React.useMemo(
    () => model.literalFields.filter((field) => !field.isVirtual),
    [model]
  );

  const relationships = React.useMemo(
    () =>
      model.relationships.filter(
        (relationship) =>
          !(['one-to-many', 'many-to-many'] as RA<RelationshipType>).includes(
            relationship.type
          ) && !relationship.isVirtual
      ),
    [model]
  );

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
          (field, index) => newRule.fields.indexOf(field) === index
        ),
        scopes: newRule.scopes.filter(
          (scope, index) => newRule.scopes.indexOf(scope) === index
        ),
      };
      loading(
        validateUniqueness(
          container.name as keyof Tables,
          filteredRule.fields as unknown as RA<never>,
          filteredRule.scopes as unknown as RA<never>
        ).then((duplicates) => {
          const isNewRule = index > tableRules.length;
          setTableRules((previous) =>
            isNewRule
              ? [...previous!, { rule: filteredRule, duplicates }]
              : replaceItem(tableRules, index, {
                  rule: filteredRule,
                  duplicates,
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
                (scope) =>
                  getFieldsFromPath(model, scope).at(-1) as Relationship
              ),
              filterArray(rule.fields.map((field) => model.getField(field)))
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
                modelName: model.name,
                fields: [fields[0].name],
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
  readonly fields: RA<LiteralField>;
  readonly relationships: RA<Relationship>;
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
                fields.find(({ name }) => name === field) ??
                relationships.find(({ name }) => name === field)
              )?.localization.name as string
            }
          />
        ))}
      </td>
      <td>
        <Input.Text
          disabled
          value={
            rule.scopes.length === 0
              ? schemaText.database()
              : getFieldsFromPath(model, rule.scopes[0])
                  .map((field) => field.localization.name as string)
                  .join(' -> ')
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
  readonly fields: RA<LiteralField>;
  readonly relationships: RA<Relationship>;
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
        (item) => [item.name, item.localization.name as string] as const
      ),
    [fields, relationships]
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
                    .map((field) => field)
                    .toString()}-in_${rule.scopes[0]}.csv`;

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
              value={field}
              onChange={(value): void => {
                const newField =
                  fields.find(({ name }) => name === value) ??
                  relationships.find(({ name }) => name === value);
                if (newField === undefined) return;
                handleChanged({
                  ...rule,
                  fields: replaceItem(rule.fields, index, newField.name),
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
                fields[0].name
              ),
            })
          }
        >
          {commonText.add()}
        </Button.BorderedGray>
        <p>{schemaText.scope()}</p>
        <UniquenessRuleScope
          model={model}
          rule={rule}
          onChange={handleChanged}
        />
        <Input.Text
          disabled
          value={
            rule.scopes.length === 0
              ? schemaText.database()
              : getFieldsFromPath(model, rule.scopes[0])
                  .map((field) => field.localization.name as string)
                  .join(' -> ')
          }
        />
      </>
    </Dialog>
  );
}

function UniquenessRuleScope({
  rule,
  model,
  onChange: handleChanged,
}: {
  readonly rule: UniquenessRule;
  readonly model: SpecifyModel;
  readonly onChange: (newRule: typeof rule) => void;
}): JSX.Element {
  const [mappingPath, setMappingPath] = React.useState<RA<string>>(
    rule.scopes.length === 0 ? ['database'] : rule.scopes[0].split('__')
  );

  const databaseScopeData: Readonly<Record<string, HtmlGeneratorFieldData>> = {
    database: {
      isDefault: true,
      isEnabled: true,
      isRelationship: false,
      optionLabel: schemaText.database(),
    },
  };

  const getValidScopeRelationships = (
    model: SpecifyModel
  ): Readonly<Record<string, HtmlGeneratorFieldData>> =>
    Object.fromEntries(
      model.relationships
        .filter(
          (relationship) =>
            !(['one-to-many', 'many-to-many'] as RA<RelationshipType>).includes(
              relationship.type
            ) && !relationship.isVirtual
        )
        .map((relationship) => [
          relationship.name,
          {
            isDefault: false,
            isEnabled: true,
            isRelationship: true,
            optionLabel: relationship.localization.name as string,
            tableName: relationship.relatedModel.name,
          },
        ])
    );

  const defaultLineData: RA<MappingLineData> = React.useMemo(
    () => [
      {
        customSelectSubtype: 'simple',
        tableName: model.name,
        fieldsData: {
          ...databaseScopeData,
          ...getValidScopeRelationships(model),
        },
      },
    ],
    [model]
  );

  const [lineData, setLineData] = React.useState(defaultLineData);

  const getRelationshipData = (newTableName: keyof Tables): MappingLineData => {
    const newModel = strictGetModel(newTableName);

    return {
      customSelectSubtype: 'simple',
      tableName: newModel.name,
      fieldsData: getValidScopeRelationships(newModel),
    };
  };

  const updateLineData = (
    mappingLines: RA<MappingLineData>,
    mappingPath: RA<string>
  ): RA<MappingLineData> =>
    mappingLines.map((lineData, index) => ({
      ...lineData,
      fieldsData: Object.fromEntries(
        Object.entries(lineData.fieldsData).map(([field, data]) => [
          field,
          { ...data, isDefault: mappingPath[index] === field },
        ])
      ),
    }));

  return (
    <MappingView
      mappingElementProps={getMappingLineProps({
        mappingLineData: lineData,
        customSelectType: 'OPENED_LIST',
        onChange({ isDoubleClick, isRelationship, index, ...rest }) {
          if (isRelationship) {
            const newMappingPath = replaceItem(
              mappingPath.slice(0, index + 1),
              index,
              rest.newValue
            );
            setMappingPath(newMappingPath);
            setLineData((lineData) =>
              updateLineData(
                [
                  ...lineData.slice(0, index + 1),
                  getRelationshipData(rest.newTableName!),
                ],
                newMappingPath
              )
            );
            if (isDoubleClick)
              handleChanged({ ...rule, scopes: [mappingPath.join('__')] });
          } else {
            handleChanged({
              ...rule,
              scopes: [],
            });
            setLineData(defaultLineData);
          }
        },
      })}
    >
      <Button.Small
        aria-label={commonText.add()}
        className="justify-center p-2"
        title={schemaText.setScope()}
        onClick={(): void => {
          handleChanged({
            ...rule,
            scopes:
              mappingPath.length === 1 && mappingPath[0] === 'database'
                ? []
                : [mappingPath.join('__')],
          });
        }}
      >
        {icons.arrowRight}
      </Button.Small>
    </MappingView>
  );
}
