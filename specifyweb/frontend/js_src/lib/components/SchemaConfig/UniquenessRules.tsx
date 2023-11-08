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
import { getTable, strictGetTable } from '../DataModel/tables';
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
  readonly header: LocalizedString;
  readonly onClose: () => void;
}): JSX.Element {
  const { language: rawLanguage = '' } = useParams();
  const [language, country = null] = rawLanguage.split('-');

  const [cachedModelRules = [], setCachedModelRules] = useModelUniquenessRules(
    container.name as keyof Tables
  );

  const [rawModelRules = [], setModelRules] =
    React.useState<UniquenessRules[keyof Tables]>(cachedModelRules);

  const currentUniqueId = React.useRef(0);

  const modelRules = React.useMemo(
    () =>
      rawModelRules.map((rule) => {
        if (rule.uniqueId === undefined) {
          const adjustedRule = {
            ...rule,
            uniqueId: currentUniqueId.current,
          };
          currentUniqueId.current += 1;
          return adjustedRule;
        }
        return rule;
      }),
    [rawModelRules]
  );

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

    return split(
      sortedItems,
      (item) => getTable(container.name)!.getField(item.name)!.isRelationship
    );
  }, [items, container.name]);

  React.useEffect(() => {
    setSavedBlocked(
      Object.entries(fetchedDuplicates).some(
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
      header={localized(header)}
      modal={false}
      onClose={handleClose}
    >
      <table className="grid-table grid-cols-[2fr_1fr] gap-2 overflow-auto">
        <thead>
          <tr>
            <td>{schemaText.uniqueFields()}</td>
            <td>{schemaText.scope()}</td>
          </tr>
        </thead>
        {modelRules?.map((rule, index) => (
          <UniquenessRuleRow
            container={container}
            fields={[...fields, ...relationships]}
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
                      [rule.uniqueId!]: data,
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
                [rule.uniqueId!]: !isRuleExpanded[rule.uniqueId!],
              })
            }
            onRemoved={(): void => {
              setModelRules([
                ...modelRules.slice(0, index),
                ...modelRules.slice(index + 1, modelRules.length),
              ]);
              setFetchedDuplicates((previousDuplicates) =>
                removeKey(previousDuplicates, rule.uniqueId!)
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
          setModelRules([
            ...modelRules,
            {
              id: null,
              fields: [fields[0]],
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
  container,
  label,
  fields,
  relationships,
  isExpanded,
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
  readonly onChange: (newRule: typeof rule) => void;
  readonly onExpanded: () => void;
  readonly onRemoved: () => void;
}): JSX.Element {
  const disableRuleModification = rule.isDatabaseConstraint;
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
                  addMissingFields('SpLocaleContainerItem', {
                    name: undefined,
                  }),
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
                schema.orgHierarchy.includes(
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
              .filter(
                (field) =>
                  !schema.orgHierarchy.includes(
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
            if (relationships === undefined) return;
            const newScope = relationships.at(
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
      </td>
    </tr>
  );
}
