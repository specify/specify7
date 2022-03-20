import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import type { FormMode, FormType } from '../parseform';
import type { FieldTypes, FormFieldDefinition } from '../parseformfields';
import type { IR } from '../types';
import { defined } from '../types';
import { getValidationAttributes } from '../uiparse';
import { Input, Textarea } from './basic';
import { ComboBox } from './combobox';
import { useAsyncState, useResourceValue } from './hooks';
import { QueryComboBox } from './querycombobox';
import { getResourceAndField } from './resource';
import { PrintOnSave, SpecifyFormCheckbox } from './specifyformcheckbox';
import { UiPlugin } from './specifyformplugin';
import { UiField } from './uifield';

const fieldRenderers: {
  readonly [KEY in keyof FieldTypes]: (props: {
    readonly resource: SpecifyResource<AnySchema>;
    readonly mode: FormMode;
    readonly fieldDefinition: FieldTypes[KEY];
    readonly id: string | undefined;
    readonly isRequired: boolean;
    readonly fieldName: string | undefined;
    readonly formType: FormType;
  }) => JSX.Element;
} = {
  Checkbox({
    id,
    resource,
    mode,
    fieldName,
    isRequired,
    fieldDefinition: { defaultValue, printOnSave, label },
  }) {
    return printOnSave ? (
      <PrintOnSave
        id={id}
        fieldName={fieldName}
        model={resource.specifyModel}
        text={label}
      />
    ) : (
      <SpecifyFormCheckbox
        id={id}
        resource={resource}
        fieldName={defined(fieldName)}
        defaultValue={defaultValue}
        isRequired={isRequired}
        isReadOnly={mode === 'view'}
        text={label}
      />
    );
  },
  TextArea({
    id,
    resource,
    mode,
    fieldName,
    isRequired,
    fieldDefinition: { defaultValue, rows },
  }) {
    const { value, updateValue, validationRef, parser } = useResourceValue(
      resource,
      defined(fieldName),
      React.useMemo(
        () => ({
          value: defaultValue,
          required: isRequired,
        }),
        [defaultValue, isRequired]
      )
    );

    const [validationAttributes, setAttributes] = React.useState<IR<string>>(
      {}
    );
    React.useEffect(
      () => setAttributes(getValidationAttributes(parser)),
      [parser]
    );

    return (
      <Textarea
        {...validationAttributes}
        forwardRef={validationRef}
        id={id}
        name={fieldName}
        value={value?.toString() ?? ''}
        onValueChange={updateValue}
        rows={rows}
        readOnly={mode === 'view'}
        required={'required' in validationAttributes && mode !== 'search'}
      />
    );
  },
  ComboBox({
    id,
    resource,
    mode,
    fieldName,
    isRequired,
    fieldDefinition: { defaultValue, pickList },
  }) {
    const [data] = useAsyncState(
      React.useCallback(
        async () => getResourceAndField(resource, fieldName),
        [resource, fieldName]
      )
    );
    return typeof data === 'undefined' ? (
      <></>
    ) : (
      <ComboBox
        id={id}
        model={resource}
        resource={data.resource}
        field={data.field}
        fieldName={fieldName}
        pickListName={pickList}
        defaultValue={defaultValue}
        className="w-full"
        mode={mode}
        isRequired={isRequired}
        isDisabled={false}
      />
    );
  },
  QueryComboBox({
    id,
    resource,
    mode,
    formType,
    fieldName,
    isRequired,
    fieldDefinition: { hasCloneButton, typeSearch },
  }) {
    return (
      <QueryComboBox
        id={id}
        resource={resource}
        mode={mode}
        formType={formType}
        fieldName={fieldName}
        isRequired={isRequired}
        hasCloneButton={hasCloneButton}
        typeSearch={typeSearch}
        forceCollection={undefined}
        relatedModel={undefined}
      />
    );
  },
  Text({
    id,
    resource,
    mode,
    fieldName,
    isRequired,
    fieldDefinition: { defaultValue, min, max, step },
  }) {
    return (
      <UiField
        id={id}
        resource={resource}
        mode={mode}
        fieldName={fieldName}
        parser={React.useMemo(
          () => ({
            defaultValue,
            min,
            max,
            step,
            required: isRequired,
          }),
          [defaultValue, min, max, step, isRequired]
        )}
      />
    );
  },
  Plugin: UiPlugin,
  FilePicker({ id, mode, fieldName, isRequired }) {
    return (
      <Input.Generic
        type="file"
        name={fieldName}
        readOnly={mode === 'view'}
        id={id}
        required={isRequired}
      />
    );
  },
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
  readonly fieldName: string | undefined;
  readonly isRequired: boolean;
  readonly formType: FormType;
}): JSX.Element {
  const Render = fieldRenderers[
    fieldDefinition.type
  ] as typeof fieldRenderers.Checkbox;
  return (
    <Render
      mode={isReadOnly ? 'view' : mode}
      {...rest}
      isRequired={rest.isRequired && mode !== 'search'}
      fieldDefinition={fieldDefinition as FieldTypes['Checkbox']}
    />
  );
}
