import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { sortFunction, toggleItem } from '../../utils/utils';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Submit } from '../Atoms/Submit';
import { getUniqueFields } from '../DataModel/resource';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { NO_CLONE } from '../Forms/ResourceView';
import { Dialog } from '../Molecules/Dialog';
import { usePref } from '../UserPreferences/usePref';

export function CarryForwardButton({
  model,
  parentModel,
  type,
}: {
  readonly model: SpecifyModel;
  readonly parentModel: SpecifyModel | undefined;
  readonly type: 'button' | 'cog';
}): JSX.Element | null {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const [globalDisabled, setGlobalDisabled] = usePref(
    'form',
    'preferences',
    'disableCarryForward'
  );
  const isEnabled = !globalDisabled.includes(model.name);
  const canChange = !NO_CLONE.has(model.name);
  return canChange ? (
    <>
      {type === 'button' ? (
        <Label.Inline className="rounded bg-[color:var(--foreground)]">
          <Input.Checkbox
            checked={isEnabled}
            onChange={(): void =>
              setGlobalDisabled(toggleItem(globalDisabled, model.name))
            }
          />
          {formsText('carryForward')}
          <Button.Small
            className="ml-2"
            title={formsText('carryForwardDescription')}
            onClick={handleOpen}
          >
            {icons.cog}
          </Button.Small>
        </Label.Inline>
      ) : (
        <Button.Icon
          icon="cog"
          title={formsText('carryForwardDescription')}
          onClick={handleOpen}
        />
      )}
      {isOpen && (
        <CarryForwardConfig
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

function CarryForwardConfig({
  model,
  parentModel,
  onClose: handleClose,
}: {
  readonly model: SpecifyModel;
  readonly parentModel: SpecifyModel | undefined;
  readonly onClose: () => void;
}): JSX.Element {
  const [showHiddenFields, setShowHiddenFields] = usePref(
    'form',
    'preferences',
    'carryForwardShowHidden'
  );

  const [globalConfig, setGlobalConfig] = usePref(
    'form',
    'preferences',
    'carryForward'
  );

  const uniqueFields = getUniqueFields(model);
  const defaultConfig = model.fields
    .filter(({ isVirtual }) => !isVirtual)
    .map(({ name }) => name)
    .filter((fieldName) => !uniqueFields.includes(fieldName));
  const isDefaultConfig = (fields: RA<string>): boolean =>
    JSON.stringify(normalize(fields)) ===
    JSON.stringify(normalize(defaultConfig));

  const config =
    (globalConfig[model.name] as RA<string> | undefined)?.filter(
      (fieldName) => !uniqueFields.includes(fieldName)
    ) ?? defaultConfig;

  function handleChange(rawFields: RA<string>): void {
    const fields = normalize(rawFields);
    setGlobalConfig({
      ...globalConfig,
      [model.name]: isDefaultConfig(fields) ? undefined : fields,
    });
  }

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
    ({ overrides, isVirtual }) =>
      !isVirtual && (!overrides.isHidden || showHiddenFields)
  );
  const relationships = model.relationships.filter(
    ({ name, overrides, isVirtual }) =>
      !reverseRelationships.includes(name) &&
      !isVirtual &&
      (!overrides.isHidden || showHiddenFields)
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
            {formsText('selectAll')}
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
            {formsText('deselectAll')}
          </Button.Green>
          <Submit.Blue form={id('form')} onClick={handleClose}>
            {commonText('close')}
          </Submit.Blue>
        </>
      }
      header={`${formsText('carryForwardDescription')} (${model.label})`}
      onClose={handleClose}
    >
      <Form className="overflow-hidden" id={id('form')} onSubmit={handleClose}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          <H3>{commonText('fields')}</H3>
          <CarryForwardCategory
            carryForward={config}
            fields={literalFields}
            uniqueFields={uniqueFields}
            onChange={handleChange}
          />
          <h3>{commonText('relationships')}</h3>
          <CarryForwardCategory
            carryForward={config}
            fields={relationships}
            uniqueFields={uniqueFields}
            onChange={handleChange}
          />
        </div>
        <Label.Inline className="border-t pt-2 dark:border-neutral-700">
          <Input.Checkbox
            checked={showHiddenFields}
            onValueChange={setShowHiddenFields}
          />
          {commonText('revealHiddenFormFields')}
        </Label.Inline>
      </Form>
    </Dialog>
  );
}

function CarryForwardCategory({
  fields,
  uniqueFields,
  carryForward,
  onChange: handleChange,
}: {
  readonly fields: RA<LiteralField | Relationship>;
  readonly uniqueFields: RA<string>;
  readonly carryForward: RA<string>;
  readonly onChange: (carryForward: RA<string>) => void;
}): JSX.Element {
  return (
    <Ul>
      {fields.map((field) => (
        <li className="flex gap-1" key={field.name}>
          <Label.Inline
            title={
              uniqueFields.includes(field.name)
                ? formsText('carryForwardUniqueField')
                : field.getLocalizedDesc()
            }
          >
            <Input.Checkbox
              checked={f.includes(carryForward, field.name)}
              disabled={uniqueFields.includes(field.name)}
              onValueChange={(): void =>
                handleChange(toggleItem(carryForward, field.name))
              }
            />
            {field.label}
          </Label.Inline>
          {field.isRelationship && field.isDependent() ? (
            <CarryForwardButton
              model={field.relatedModel}
              parentModel={field.model}
              type="cog"
            />
          ) : undefined}
        </li>
      ))}
    </Ul>
  );
}
