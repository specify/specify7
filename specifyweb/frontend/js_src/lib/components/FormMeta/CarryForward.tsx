import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { interactionsText } from '../../localization/interactions';
import { schemaText } from '../../localization/schema';
import { wbPlanText } from '../../localization/wbPlan';
import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { sortFunction, toggleItem } from '../../utils/utils';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Submit } from '../Atoms/Submit';
import { getFieldsToClone, getUniqueFields } from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { NO_CLONE } from '../Forms/ResourceView';
import { Dialog } from '../Molecules/Dialog';
import { userPreferences } from '../Preferences/userPreferences';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';

/**
 * Fields to always carry forward (unless "Deselect All" is pressed), but not
 * show in the UI.
 */
const invisibleCarry = new Set([
  'collection',
  'collections',
  'definition',
  'definitionItem',
  'discipline',
  'disciplines',
  'division',
  'divisions',
  // There is literally a database field with a typo in its name (in Address table)
  'insitutions',
  'institution',
  'institutions',
  'scope',
]);

/** Search for all dependent fields using a suffix */
const dependentFieldSeeker = (suffix: string): IR<string> =>
  Object.fromEntries(
    Object.values(schema.models)
      .flatMap(({ literalFields }) =>
        literalFields.filter((v) => v.name.toLowerCase().endsWith(suffix))
      )
      .map(
        (v) =>
          [
            v.name,
            v.model.getField(v.name.slice(0, -suffix.length))?.name,
          ] as const
      )
      .filter(([_dependent, source]) => typeof source === 'string')
  ) as IR<string>;

/**
 * Dependent -> Source
 * When value in one field is based on another, don't show the dependent field in
 * the UI, but copy its carry over settings from the source field
 */
export const dependentFields = f.store<IR<string>>(() => ({
  lat1text: 'latitude1',
  lat2text: 'latitude2',
  long1text: 'longitude1',
  long2text: 'longitude2',
  // Fields like endDatePrecision
  ...dependentFieldSeeker('precision'),
  // Fields like endDateVerbatim
  ...dependentFieldSeeker('verbatim'),
  // Fields like endDepthUnit
  ...dependentFieldSeeker('unit'),
}));

export function CarryForwardConfig({
  model,
  parentModel,
  type,
}: {
  readonly model: SpecifyModel;
  readonly parentModel: SpecifyModel | undefined;
  readonly type: 'button' | 'cog';
}): JSX.Element | null {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const [globalEnabled, setGlobalEnabled] = userPreferences.use(
    'form',
    'preferences',
    'enableCarryForward'
  );
  const isEnabled = globalEnabled.includes(model.name);
  const canChange = !NO_CLONE.has(model.name);

  return canChange ? (
    <>
      {type === 'button' ? (
        <Label.Inline className="rounded bg-[color:var(--foreground)]">
          <Input.Checkbox
            checked={isEnabled}
            onChange={(): void =>
              setGlobalEnabled(toggleItem(globalEnabled, model.name))
            }
          />
          {formsText.carryForwardEnabled()}
          <Button.Small
            className="ml-2"
            title={formsText.carryForwardSettingsDescription()}
            onClick={handleOpen}
          >
            {icons.cog}
          </Button.Small>
        </Label.Inline>
      ) : (
        <Button.Icon
          icon="cog"
          title={formsText.carryForwardSettingsDescription()}
          onClick={handleOpen}
        />
      )}
      {isOpen && (
        <CarryForwardConfigDialog
          model={model}
          parentModel={parentModel}
          onClose={handleClose}
        />
      )}
    </>
  ) : null;
}

const normalize = (fields: RA<string>): RA<string> =>
  Array.from(fields).sort(sortFunction(f.id));

function CarryForwardConfigDialog({
  model,
  parentModel,
  onClose: handleClose,
}: {
  readonly model: SpecifyModel;
  readonly parentModel: SpecifyModel | undefined;
  readonly onClose: () => void;
}): JSX.Element {
  const [showHiddenFields, setShowHiddenFields] = userPreferences.use(
    'form',
    'preferences',
    'carryForwardShowHidden'
  );

  const [globalConfig, setGlobalConfig] = userPreferences.use(
    'form',
    'preferences',
    'carryForward'
  );

  const uniqueFields = getUniqueFields(model);
  const defaultConfig = getFieldsToClone(model).filter(
    (fieldName) => !uniqueFields.includes(fieldName)
  );
  const isDefaultConfig = (fields: RA<string>): boolean =>
    JSON.stringify(normalize(fields)) ===
    JSON.stringify(normalize(defaultConfig));

  const config =
    (globalConfig[model.name] as RA<string> | undefined)?.filter(
      (fieldName) => !uniqueFields.includes(fieldName)
    ) ?? defaultConfig;

  const handleChange = (fields: RA<string>): void =>
    setGlobalConfig({
      ...globalConfig,
      [model.name]: isDefaultConfig(fields) ? undefined : fields,
    });

  const reverseRelationships = React.useMemo(
    () =>
      filterArray(
        parentModel?.relationships
          .filter(({ relatedModel }) => relatedModel === model)
          .flatMap(({ otherSideName }) => otherSideName) ?? []
      ),
    [parentModel, model]
  );

  const literalFields = model.literalFields.filter(
    ({ name, overrides, isVirtual }) =>
      !isVirtual &&
      (!overrides.isHidden || showHiddenFields) &&
      !invisibleCarry.has(name)
  );
  const relationships = model.relationships.filter(
    (field) =>
      !reverseRelationships.includes(field.name) &&
      !field.isVirtual &&
      (!field.overrides.isHidden || showHiddenFields) &&
      (field.isDependent() || !relationshipIsToMany(field)) &&
      !invisibleCarry.has(field.name)
  );

  const id = useId('form-carry-forward');
  return (
    <Dialog
      buttons={
        <>
          <Button.Green
            disabled={isDefaultConfig(config)}
            onClick={(): void =>
              handleChange(
                showHiddenFields
                  ? defaultConfig
                  : model.fields
                      .filter(
                        ({ name, isVirtual, overrides }) =>
                          !isVirtual &&
                          !reverseRelationships.includes(name) &&
                          (!overrides.isHidden || config.includes(name))
                      )
                      .map(({ name }) => name)
              )
            }
          >
            {interactionsText.selectAll()}
          </Button.Green>
          <Button.Green
            disabled={config.length === 0}
            onClick={(): void =>
              handleChange(
                // Don't deselect hidden fields if they are not visible
                showHiddenFields
                  ? []
                  : model.fields
                      .filter(
                        ({ name, isVirtual, overrides }) =>
                          !isVirtual &&
                          !reverseRelationships.includes(name) &&
                          overrides.isHidden &&
                          config.includes(name)
                      )
                      .map(({ name }) => name)
              )
            }
          >
            {interactionsText.deselectAll()}
          </Button.Green>
          <Submit.Blue form={id('form')} onClick={handleClose}>
            {commonText.close()}
          </Submit.Blue>
        </>
      }
      header={formsText.carryForwardTableSettingsDescription({
        tableName: model.label,
      })}
      onClose={handleClose}
    >
      <Form className="overflow-hidden" id={id('form')} onSubmit={handleClose}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          <CarryForwardCategory
            carryForward={config}
            fields={literalFields}
            header={schemaText.fields()}
            model={model}
            uniqueFields={uniqueFields}
            onChange={handleChange}
          />
          <CarryForwardCategory
            carryForward={config}
            fields={relationships}
            header={schemaText.relationships()}
            model={model}
            uniqueFields={uniqueFields}
            onChange={handleChange}
          />
        </div>
        <Label.Inline className="border-t pt-2 dark:border-neutral-700">
          <Input.Checkbox
            checked={showHiddenFields}
            onValueChange={setShowHiddenFields}
          />
          {wbPlanText.revealHiddenFormFields()}
        </Label.Inline>
      </Form>
    </Dialog>
  );
}

function CarryForwardCategory({
  header,
  model,
  fields,
  uniqueFields,
  carryForward,
  onChange: handleChange,
}: {
  readonly header: string;
  readonly model: SpecifyModel;
  readonly fields: RA<LiteralField | Relationship>;
  readonly uniqueFields: RA<string>;
  readonly carryForward: RA<string>;
  readonly onChange: (carryForward: RA<string>) => void;
}): JSX.Element | null {
  return fields.length > 0 ? (
    <>
      <H3>{header}</H3>
      <Ul>
        {fields.map((field) => {
          const isUnique = uniqueFields.includes(field.name);
          return (
            <li className="flex gap-1" key={field.name}>
              <Label.Inline
                title={
                  isUnique
                    ? formsText.carryForwardUniqueField()
                    : field.getLocalizedDesc()
                }
              >
                <Input.Checkbox
                  checked={f.includes(carryForward, field.name)}
                  disabled={isUnique}
                  onValueChange={(isChecked): void => {
                    const dependents = filterArray(
                      Object.entries(dependentFields())
                        .filter(([_dependent, source]) => source === field.name)
                        .map(([dependent]) => model.getField(dependent)?.name)
                    );
                    handleChange(
                      isChecked
                        ? f.unique([...carryForward, field.name, ...dependents])
                        : carryForward.filter(
                            (name) =>
                              name !== field.name && !dependents.includes(name)
                          )
                    );
                  }}
                />
                {field.label}
              </Label.Inline>
              {field.isRelationship && field.isDependent() && !isUnique ? (
                <CarryForwardConfig
                  model={field.relatedModel}
                  parentModel={field.model}
                  type="cog"
                />
              ) : undefined}
            </li>
          );
        })}
      </Ul>
    </>
  ) : null;
}
