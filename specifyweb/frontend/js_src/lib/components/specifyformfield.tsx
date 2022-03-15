import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import type { FormMode } from '../parseform';
import type { FieldTypes, FormFieldDefinition } from '../parseformfields';
import type { IR } from '../types';
import { defined } from '../types';
import {
  getValidationAttributes,
  mergeParsers,
  resolveParser,
} from '../uiparse';
import { Input, Textarea } from './basic';
import { ComboBox } from './combobox';
import { useAsyncState } from './hooks';
import { PrintOnSave, SpecifyFormCheckbox } from './specifyformcheckbox';
import { UiPlugin } from './specifyformplugin';

export function useResourceValue<T>(
  resource: SpecifyResource<AnySchema>,
  fieldName: string,
  defaultValue: T | undefined
): Readonly<[value: T | undefined, setValue: (newValue: T) => void]> {
  const [value, setValue] = React.useState<T | undefined>(undefined);
  const updateValue = React.useCallback(
    function updateValue(newValue: T) {
      setValue(newValue);
      resource.set(fieldName, newValue);
    },
    [resource, fieldName]
  );
  React.useEffect(() => {
    if (typeof resource.specifyModel.getField(fieldName) === 'undefined')
      console.error(
        `${fieldName} does not exist on ${resource.specifyModel.name}`,
        { resource }
      );

    if (resource.isNew() && typeof defaultValue !== 'undefined')
      resource.set(fieldName, defaultValue);

    const refresh = (): void =>
      setValue((resource.get(fieldName) as T | null) ?? defaultValue);

    resource.on(`change:${fieldName}`, refresh);
    refresh();
    return (): void => resource.off(`change:${fieldName}`, refresh);
  }, [resource, fieldName, defaultValue]);

  return [value, updateValue] as const;
}

const fieldRenderers: {
  readonly [KEY in keyof FieldTypes]: (props: {
    readonly resource: SpecifyResource<AnySchema>;
    readonly isReadOnly: boolean;
    readonly fieldDefinition: FieldTypes[KEY];
    readonly id: string | undefined;
    readonly fieldName: string;
    readonly isRequired: boolean;
  }) => JSX.Element;
} = {
  Checkbox({
    id,
    resource,
    isReadOnly,
    fieldName,
    isRequired,
    fieldDefinition: { defaultValue, printOnSave },
  }) {
    return printOnSave ? (
      <PrintOnSave id={id} name={fieldName} />
    ) : (
      <SpecifyFormCheckbox
        id={id}
        resource={resource}
        fieldName={fieldName}
        defaultValue={defaultValue}
        isRequired={isRequired}
        isReadOnly={isReadOnly}
      />
    );
  },
  TextArea({
    id,
    resource,
    isReadOnly,
    fieldName,
    isRequired,
    fieldDefinition: { defaultValue, rows },
  }) {
    const [validationAttributes, setAttributes] = React.useState<IR<string>>(
      {}
    );
    React.useEffect(() => {
      const parser = defined(
        resolveParser(defined(resource.specifyModel.getField(fieldName)))
      );
      const mergedParsers = defined(
        mergeParsers(parser, {
          required: isRequired,
        })
      );
      setAttributes(getValidationAttributes(mergedParsers));
    }, [resource.specifyModel, fieldName, isRequired, isReadOnly]);

    const [value, setValue] = useResourceValue(
      resource,
      fieldName,
      defaultValue
    );
    return (
      <Textarea
        id={id}
        name={fieldName}
        value={value}
        onValueChange={setValue}
        rows={rows}
        readOnly={isReadOnly}
        {...validationAttributes}
      />
    );
  },
  ComboBox({
    id,
    resource,
    isReadOnly,
    fieldName,
    isRequired,
    fieldDefinition: { defaultValue, pickList },
  }) {
    const [data] = useAsyncState(
      React.useCallback(
        async () => resource.getResourceAndField(fieldName),
        [resource, fieldName]
      )
    );
    return typeof data === 'undefined' ? (
      <></>
    ) : (
      <ComboBox
        id={id}
        model={resource}
        resource={data[0]}
        field={data[1]}
        fieldName={fieldName}
        pickListName={pickList}
        defaultValue={defaultValue}
        className="w-full"
        isReadOnly={isReadOnly}
        isRequired={isRequired}
        isDisabled={false}
      />
    );
  },
  QueryComboBox({ id, resource, isReadOnly, fieldName, isRequired }) {},
  Text({
    id,
    resource,
    isReadOnly,
    fieldName,
    isRequired,
    fieldDefinition: { defaultValue, min, max, step },
  }) {
    const [validationAttributes, setAttributes] = React.useState<IR<string>>(
      {}
    );
    React.useEffect(() => {
      const parser = defined(
        resolveParser(defined(resource.specifyModel.getField(fieldName)))
      );
      const mergedParsers = defined(
        mergeParsers(parser, {
          required: isRequired,
          min,
          max,
          step,
        })
      );
      setAttributes(getValidationAttributes(mergedParsers));
    }, [resource.specifyModel, fieldName, isRequired, min, max, step]);
    const [value, setValue] = useResourceValue(
      resource,
      fieldName,
      defaultValue
    );
    return (
      <Input.Generic
        value={value}
        onValueChange={(newValue): void => setValue(newValue)}
        id={id}
        className="w-full"
        readOnly={isReadOnly}
        {...validationAttributes}
      />
    );
  },
  Plugin: UiPlugin,
  FilePicker({ id, resource, isReadOnly, fieldName, isRequired }) {},
};

export function FormField({
  mode,
  fieldDefinition: { isReadOnly, ...fieldDefinition },
  ...rest
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly mode: FormMode;
  readonly id: string | undefined;
  readonly fieldDefinition: FormFieldDefinition;
  readonly fieldName: string;
  readonly isRequired: boolean;
}): JSX.Element {
  const Render = fieldRenderers[fieldDefinition.type];
  return (
    <Render
      isReadOnly={isReadOnly || mode === 'view'}
      {...rest}
      fieldDefinition={fieldDefinition}
    />
  );
}
