import React from 'react';
import { useParams } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { ajax } from '../../utils/ajax';
import type { IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { sortFunction, split } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { addMissingFields } from '../DataModel/addMissingFields';
import type { SerializedResource } from '../DataModel/helperTypes';
import { schema } from '../DataModel/schema';
import { getTable } from '../DataModel/tables';
import type {
  SpLocaleContainer,
  SpLocaleContainerItem,
  Tables,
} from '../DataModel/types';
import type {
  UniquenessRule,
  UniquenessRules,
  UniquenessRuleValidation,
} from '../DataModel/uniquenessRules';
import {
  getUniqueInvalidReason,
  useModelUniquenessRules,
  validateUniqueness,
} from '../DataModel/uniquenessRules';
import { Dialog } from '../Molecules/Dialog';
import type { WithFetchedStrings } from '../Toolbar/SchemaConfig';
import { PickList } from './Components';
import { useContainerItems } from './Hooks';

export function TableUniquenessRules({
  container,
  header,
  onClose: handleClose,
}: {
  readonly container: SerializedResource<SpLocaleContainer>;
  readonly header: string;
  readonly onClose: () => void;
}): JSX.Element {
  const { language: rawLanguage = '' } = useParams();
  const [language, country = null] = rawLanguage.split('-');

  const [cachedModelRules = [], setCachedModelRules] = useModelUniquenessRules(
    container.name as keyof Tables
  );

  const [modelRules, setModelRules] =
    React.useState<UniquenessRules[keyof Tables]>(cachedModelRules);

  const loading = React.useContext(LoadingContext);

  const [saveBlocked, setSavedBlocked] = React.useState(false);

  const [fetchedDuplicates, setFetchedDuplicates] = React.useState<
    Record<number, UniquenessRuleValidation> | undefined
  >(undefined);

  const [isRuleExpanded, setRuleExpanded] = React.useState<IR<boolean>>({});

  const [items] = useContainerItems(container, language, country);

  const [fields, relationships] = React.useMemo(() => {
    const sortedItems = Object.values(items ?? []).sort(
      sortFunction(({ name }) => name)
    );

    return split(
      sortedItems,
      (item) => getTable(container.name)!.getField(item.name)!.isRelationship
    );
  }, [items, container.name]);

  React.useEffect(() => {
    setSavedBlocked(
      Object.entries(fetchedDuplicates ?? {}).some(
        ([_, validationResults]) => validationResults.totalDuplicates > 0
      )
    );
  }, [fetchedDuplicates]);

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
              disabled={cachedModelRules === modelRules}
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
      header={header}
      modal={false}
      onClose={handleClose}
    >
      <table className="grid-table grid-cols-[auto_auto] overflow-auto">
        <thead>
          <tr>
            <td>{schemaText.uniqueFields()}</td>
            <td>{schemaText.scope()}</td>
          </tr>
        </thead>
        {modelRules?.map((rule, index) => (
          <UniquenessRuleRow
            fields={[...fields, ...relationships]}
            isExpanded={isRuleExpanded[index.toString()]}
            key={rule.id ?? index}
            label={getUniqueInvalidReason(
              getTable(container.name)?.getField(rule.scope?.name ?? ''),
              filterArray(
                rule.fields.map((field) =>
                  getTable(container.name)?.getField(field.name)
                )
              )
            )}
            relationships={relationships}
            rule={rule}
            onChange={(newRule): void => {
              loading(
                Promise.resolve(
                  validateUniqueness(
                    container.name as keyof Tables,
                    newRule.fields
                      .filter((field) => field.name !== '')
                      .map((field) => field.name) as unknown as RA<never>,
                    newRule.scope === null || newRule.scope === undefined
                      ? undefined
                      : (newRule.scope.name as unknown as undefined)
                  ).then((data) => {
                    setFetchedDuplicates((previousDuplicates) => ({
                      ...previousDuplicates,
                      [index]: data,
                    }));
                    setModelRules([
                      ...modelRules.slice(0, index),
                      newRule,
                      ...modelRules.slice(index + 1, modelRules.length),
                    ]);
                    return modelRules;
                  })
                )
              );
            }}
            onExpanded={(): void =>
              setRuleExpanded({
                ...isRuleExpanded,
                [index.toString()]: !isRuleExpanded[index.toString()],
              })
            }
            onRemoved={(): void => {
              setModelRules([
                ...modelRules.slice(0, index),
                ...modelRules.slice(index + 1, modelRules.length),
              ]);
            }}
          />
        ))}
      </table>
      <Button.Small
        className="w-fit"
        onClick={(): void => {
          setModelRules([
            ...modelRules,
            {
              id: undefined,
              fields: [],
              isDatabaseConstraint: false,
              scope: null,
            },
          ]);
        }}
      >
        {schemaText.addUniquenessRule()}
      </Button.Small>
    </Dialog>
  );
}

function UniquenessRuleRow({
  rule,
  label,
  fields,
  relationships,
  isExpanded,
  onChange: handleChanged,
  onExpanded: handleExpanded,
  onRemoved: handleRemoved,
}: {
  readonly rule: UniquenessRule;
  readonly label: string;
  readonly fields:
    | RA<SerializedResource<SpLocaleContainerItem> & WithFetchedStrings>
    | undefined;
  readonly relationships:
    | RA<SerializedResource<SpLocaleContainerItem> & WithFetchedStrings>
    | undefined;
  readonly isExpanded: boolean;
  readonly onChange: (newRule: typeof rule) => void;
  readonly onExpanded: () => void;
  readonly onRemoved: () => void;
}): JSX.Element {
  const disableRuleModification = rule?.isDatabaseConstraint;
  /*
   * {schemaText.uniqueFields()}
   * {schemaText.scope()}
   */
  return (
    <tr title={isExpanded ? '' : label}>
      <td>
        {disableRuleModification ? null : (
          <Button.Small className="w-fit" onClick={handleExpanded}>
            {isExpanded ? icons.chevronDown : icons.chevronRight}
          </Button.Small>
        )}
        {(rule?.fields ?? []).map((field, index) => (
          <>
            <PickList
              disabled={disableRuleModification}
              groups={{
                field: Array.from(
                  (fields ?? []).map((field, index) => [
                    (index + 1).toString(),
                    field.strings.name.text,
                  ])
                ) as RA<readonly [string, string]>,
              }}
              value={(
                (fields ?? [])
                  .map((field) => field.name)
                  .indexOf(field?.name ?? 0) + 1
              ).toString()}
              onChange={(value): void => {
                if (fields === undefined) return;
                const newField = fields[Number(value) - 1];
                handleChanged({
                  id: rule.id,
                  fields: [
                    ...rule.fields.slice(0, index),
                    newField,
                    ...rule.fields.slice(index + 1, fields.length),
                  ],
                  scope: rule.scope,
                  isDatabaseConstraint: rule.isDatabaseConstraint,
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
                    id: rule.id,
                    fields: [
                      ...rule.fields.slice(0, index),
                      ...rule.fields.slice(index + 1, rule.fields.length),
                    ],
                    scope: rule.scope,
                    isDatabaseConstraint: rule.isDatabaseConstraint,
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
                id: rule.id,
                fields: [
                  ...rule.fields,
                  addMissingFields('SpLocaleContainerItem', {
                    name: undefined,
                  }),
                ],
                scope: rule.scope,
                isDatabaseConstraint: rule.isDatabaseConstraint,
              })
            }
          />
        ) : null}
      </td>
      <tr>
        <td>
          <PickList
            disabled={disableRuleModification}
            groups={{
              relationship: Array.from(
                (relationships ?? []).map((field, index) => [
                  (index + 1).toString(),
                  field.strings.name.text,
                ])
              ) as RA<readonly [string, string]>,
            }}
            value={
              rule?.scope === null || rule.scope === undefined
                ? null
                : (
                    (relationships ?? [])
                      ?.map((field) => field.name)
                      .indexOf(rule.scope.name) + 1
                  ).toString()
            }
            onChange={(value): void => {
              if (relationships === undefined) return;
              const newScope = relationships[Number(value) - 1];
              handleChanged({
                id: rule.id,
                fields: rule.fields,
                scope: newScope,
                isDatabaseConstraint: rule.isDatabaseConstraint,
              });
            }}
          />
          {isExpanded ? (
            <Button.Icon
              className="col-start-1 w-fit"
              icon="trash"
              title={commonText.remove()}
              onClick={handleRemoved}
            />
          ) : null}
        </td>
      </tr>
    </tr>
  );
}
