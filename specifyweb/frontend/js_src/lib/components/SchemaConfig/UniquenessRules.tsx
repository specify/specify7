import React from 'react';
import { useParams } from 'react-router-dom';
import { NewSpLocaleItemString, SpLocaleItemString } from '.';
import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import { filterArray, RA } from '../../utils/types';
import { group, sortFunction, split } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { LoadingContext } from '../Core/Contexts';
import { addMissingFields } from '../DataModel/addMissingFields';
import { fetchCollection } from '../DataModel/collection';
import { SerializedResource } from '../DataModel/helperTypes';
import { getModel, schema } from '../DataModel/schema';
import {
  SpLocaleContainer,
  SpLocaleContainerItem,
  Tables,
} from '../DataModel/types';
import {
  getUniqueInvalidReason,
  UniquenessRules,
  UniquenessRuleValidation,
  useModelUniquenessRules,
  validateUniqueness,
} from '../DataModel/uniquenessRules';
import { Slider } from '../FormSliders/Slider';
import { Dialog } from '../Molecules/Dialog';
import { hasToolPermission } from '../Permissions/helpers';
import { PickList } from './Components';
import { findString } from './helpers';

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

  const [index, setIndex] = React.useState(0);
  const currentRule =
    typeof modelRules === 'undefined'
      ? ({
          id: null,
          fields: [],
          scope: null,
          isDatabaseConstraint: false,
        } as Exclude<UniquenessRules[keyof Tables], undefined>[number])
      : modelRules[index];

  const [saveBlocked, setSavedBlocked] = React.useState(false);

  const [fetchedDuplicates, setFetchedDuplicates] = React.useState<
    Record<number, UniquenessRuleValidation> | undefined
  >(undefined);

  const [items] = useAsyncState<
    RA<
      SerializedResource<SpLocaleContainerItem> & {
        //REFACTOR: use WithFetchedStrings type
        strings: { name: NewSpLocaleItemString | SpLocaleItemString };
      }
    >
  >(
    React.useCallback(
      async () =>
        f
          .all({
            items: fetchCollection('SpLocaleContainerItem', {
              limit: 0,
              container: container.id,
            }),
            names: fetchCollection(
              'SpLocaleItemStr',
              {
                limit: 0,
              },
              {
                itemName__container: container.id,
              }
            ).then(({ records }) =>
              Object.fromEntries(
                group(records.map((name) => [name.itemName, name]))
              )
            ),
          })
          .then(({ items, names }) =>
            items.records
              .filter(
                (item) =>
                  (getModel(container.name)!.getField(item.name) !==
                    undefined &&
                    !getModel(container.name)!.getField(item.name)!
                      .isRelationship) ||
                  getModel(container.name)
                    ?.getRelationship(item.name)
                    ?.type.split('-')
                    .at(-1) === 'one'
              )
              .map((item) => ({
                ...item,
                strings: {
                  name: findString(
                    names[item.resource_uri],
                    language,
                    country,
                    'itemName',
                    item.resource_uri
                  ),
                },
              }))
          ),
      [container.id]
    ),
    false
  );

  const uniquenessLabel = getUniqueInvalidReason(
    getModel(container.name)?.getRelationship(currentRule.scope?.name ?? ''),
    filterArray(
      currentRule.fields.map((field) =>
        getModel(container.name)?.getField(field.name)
      )
    )
  );

  const sortedItems = React.useMemo(() => {
    return Object.values(items ?? []).sort(sortFunction(({ name }) => name));
  }, [items]);

  const handleRemovingRule = (ruleIndex: number) => {
    const removedRule = [
      ...(modelRules?.slice(0, ruleIndex) ?? []),
      ...(modelRules?.slice(ruleIndex + 1, modelRules.length) ?? []),
    ];
    setModelRules(removedRule);

    setFetchedDuplicates((previousDuplicates) => {
      if (previousDuplicates === undefined) return;
      const {
        [index]: {},
        ...updatedState
      } = previousDuplicates;
      return updatedState;
    });
    setIndex(index < 1 ? 0 : index - 1);
  };

  const handleAddingRule = () => {
    setModelRules([
      ...(modelRules ?? []),
      { id: null, fields: [], scope: null, isDatabaseConstraint: false },
    ]);
    setIndex(modelRules?.length ?? 1);
  };

  const handleChangingRule = (index: number, newRule: typeof currentRule) => {
    setModelRules([
      ...(modelRules?.slice(0, index) ?? []),
      newRule,
      ...(modelRules?.slice(index + 1, modelRules.length) ?? []),
    ]);
  };

  React.useEffect(() => {
    Object.entries(fetchedDuplicates ?? {}).some(
      ([_, validationResults]) => validationResults.totalDuplicates > 0
    )
      ? setSavedBlocked(true)
      : setSavedBlocked(false);
  }, [fetchedDuplicates]);

  return (
    <>
      <Dialog
        header={header}
        headerButtons={
          <div className="flex flex-col items-center gap-2 md:contents md:flex-row md:gap-8">
            <div className="flex items-center gap-2 md:contents">
              <Button.Icon
                disabled={currentRule.isDatabaseConstraint}
                icon="minus"
                className={className.dataEntryRemove}
                title={commonText.remove()}
                onClick={() => handleRemovingRule(index)}
              />
              <Button.Icon
                className={className.dataEntryAdd}
                icon="plus"
                title={commonText.add()}
                onClick={handleAddingRule}
              />
            </div>
            <span className="-ml-2 flex-1" />
            {(modelRules?.length ?? 0) > 1 ? (
              <Slider
                value={index}
                count={modelRules?.length ?? 0}
                onChange={(newIndex) => setIndex(newIndex)}
              />
            ) : null}
          </div>
        }
        buttons={
          <>
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
            {saveBlocked ? (
              <Button.Danger
                className="cursor-not-allowed"
                onClick={() => undefined}
              >
                {commonText.save()}
              </Button.Danger>
            ) : (
              <Button.Save
                disabled={cachedModelRules === modelRules}
                onClick={() => {
                  setCachedModelRules(modelRules);
                  loading(
                    ajax(
                      `/businessrules/uniqueness_rules/${schema.domainLevelIds['discipline']}/`,
                      {
                        headers: { Accept: 'application/json' },
                        method: 'POST',
                        body: {
                          rules: modelRules,
                        },
                      }
                    )
                  );
                  handleClose();
                }}
              >
                {commonText.save()}
              </Button.Save>
            )}
          </>
        }
        modal={false}
        onClose={handleClose}
      >
        <UniquenessRule
          rule={currentRule}
          fields={sortedItems}
          onChange={(newRule) => {
            loading(
              Promise.resolve(
                validateUniqueness(
                  container.name as keyof Tables,
                  newRule.fields
                    .filter((field) => (field?.name ?? '') !== '')
                    .map((field) => field.name) as unknown as RA<never>,
                  newRule.scope == null
                    ? undefined
                    : (newRule.scope.name as unknown as undefined)
                ).then(({ data }) => {
                  setFetchedDuplicates((previousDuplicates) => ({
                    ...previousDuplicates,
                    [index]: data,
                  }));
                  handleChangingRule(index, newRule);
                })
              )
            );
          }}
          label={uniquenessLabel}
        />
      </Dialog>
    </>
  );
}

export function UniquenessRule({
  rule,
  fields,
  label,
  onChange: handleChanged,
}: {
  readonly rule: Exclude<UniquenessRules[keyof Tables], undefined>[number];
  readonly fields:
    | RA<
        SerializedResource<SpLocaleContainerItem> & {
          //REFACTOR: use WithFetchedStrings type
          strings: { name: NewSpLocaleItemString | SpLocaleItemString };
        }
      >
    | undefined;
  readonly label: string;
  readonly onChange: (newRule: typeof rule) => void | undefined;
}): JSX.Element {
  const disableRuleModification =
    !hasToolPermission('schemaConfig', 'update') || rule?.isDatabaseConstraint;

  return (
    <>
      <Label.Block>
        {schemaText.uniqueFields()}
        {(rule?.fields ?? []).map((field, index) => (
          <div className="flex pb-4">
            <PickList
              disabled={disableRuleModification}
              value={(
                (fields ?? [])
                  .map((field) => field.name)
                  .indexOf(field?.name ?? 0) + 1
              ).toString()}
              groups={{
                Field: [
                  ...(fields ?? []).map((field, index) => [
                    (index + 1).toString(),
                    field.strings.name.text,
                  ]),
                ] as unknown as RA<readonly [string, string]>,
              }}
              onChange={(value) => {
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
            {!disableRuleModification ? (
              <Button.Icon
                className={className.dataEntryRemove}
                icon="minus"
                title={commonText.remove()}
                onClick={() =>
                  handleChanged({
                    id: rule.id,
                    fields: [
                      ...rule.fields?.slice(0, index),
                      ...rule.fields?.slice(index + 1, rule.fields.length),
                    ],
                    scope: rule.scope,
                    isDatabaseConstraint: rule.isDatabaseConstraint,
                  })
                }
              />
            ) : null}
          </div>
        ))}
        {!disableRuleModification ? (
          <Button.Icon
            className={className.dataEntryAdd}
            icon="plus"
            title={commonText.add()}
            onClick={() =>
              handleChanged({
                id: rule.id,
                fields: [
                  ...(rule?.fields ?? []),
                  addMissingFields('SpLocaleContainerItem', {
                    name: undefined,
                  }),
                ],
                scope: rule?.scope ?? null,
                isDatabaseConstraint: rule?.isDatabaseConstraint ?? false,
              })
            }
          />
        ) : null}
      </Label.Block>
      <Label.Block>
        {schemaText.scope()}
        <PickList
          disabled={disableRuleModification}
          value={
            rule?.scope == null
              ? null
              : (
                  (fields ?? [])
                    ?.map((field) => field.name)
                    .indexOf(rule.scope.name) + 1
                ).toString()
          }
          groups={{
            Relationship: [
              ...(fields ?? []).map((field, index) => [
                (index + 1).toString(),
                field.strings.name.text,
              ]),
            ] as unknown as RA<readonly [string, string]>,
          }}
          onChange={(value) => {
            if (fields === undefined) return;
            const newScope = fields[Number(value) - 1];
            handleChanged({
              id: rule.id,
              fields: rule.fields,
              scope: newScope,
              isDatabaseConstraint: rule.isDatabaseConstraint,
            });
          }}
        />
      </Label.Block>
      <span className="h-2 w-full" />
      <div className="flex-col">
        {icons.informationCircle}
        <Input.Text disabled={true} value={label} />
      </div>
    </>
  );
}
