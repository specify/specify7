import React from 'react';

import { useDistantRelated } from '../../hooks/resource';
import { useResourceValue } from '../../hooks/useResourceValue';
import type { Parser } from '../../utils/parser/definitions';
import { getValidationAttributes } from '../../utils/parser/definitions';
import type { IR, RA } from '../../utils/types';
import { Textarea } from '../Atoms/Form';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import type { FormMode, FormType } from '../FormParse';
import type { FieldTypes, FormFieldDefinition } from '../FormParse/fields';
import { FormPlugin } from '../FormPlugins';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { userPreferences } from '../Preferences/userPreferences';
import { PrintOnSave, SpecifyFormCheckbox } from './Checkbox';
import { Combobox } from './ComboBox';
import { UiField } from './Field';
import { QueryComboBox } from './QueryComboBox';

const fieldRenderers: {
  readonly [KEY in keyof FieldTypes]: (props: {
    readonly resource: SpecifyResource<AnySchema> | undefined;
    readonly mode: FormMode;
    readonly fieldDefinition: FieldTypes[KEY];
    readonly id: string | undefined;
    readonly isRequired: boolean;
    readonly name: string | undefined;
    readonly field: LiteralField | Relationship | undefined;
    readonly formType: FormType;
  }) => JSX.Element | null;
} = {
  Checkbox({
    id,
    resource,
    mode,
    name,
    field,
    fieldDefinition: { defaultValue, printOnSave, label },
  }) {
    const table = resource?.specifyModel ?? field?.model;
    return printOnSave ? (
      table === undefined ? null : (
        <PrintOnSave
          defaultValue={defaultValue}
          field={field}
          id={id}
          model={table}
          name={name}
          text={label}
        />
      )
    ) : field?.isRelationship ? null : (
      <SpecifyFormCheckbox
        defaultValue={defaultValue}
        field={field}
        id={id}
        isReadOnly={mode === 'view'}
        name={name}
        resource={resource}
        text={label}
      />
    );
  },
  TextArea({
    id,
    name,
    resource,
    mode,
    field,
    isRequired,
    fieldDefinition: { defaultValue, rows },
    formType,
  }) {
    const { value, updateValue, validationRef, parser } = useResourceValue(
      resource,
      field,
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

    const [autoGrow] = userPreferences.use(
      'form',
      'behavior',
      'textAreaAutoGrow'
    );
    const Component =
      autoGrow && formType !== 'formTable' ? AutoGrowTextArea : Textarea;

    return (
      <ErrorBoundary dismissible>
        <Component
          {...validationAttributes}
          forwardRef={validationRef}
          id={id}
          isReadOnly={mode === 'view' || field === undefined}
          name={name}
          required={'required' in validationAttributes && mode !== 'search'}
          rows={formType === 'formTable' ? 1 : rows}
          value={value?.toString() ?? ''}
          onBlur={(): void => updateValue(value?.toString() ?? '')}
          onValueChange={(value): void => updateValue(value, false)}
        />
      </ErrorBoundary>
    );
  },
  ComboBox({
    id,
    resource,
    mode,
    field,
    isRequired,
    fieldDefinition: { defaultValue, pickList },
  }) {
    return field === undefined ? null : (
      <Combobox
        defaultValue={defaultValue}
        field={field}
        id={id}
        isDisabled={false}
        isRequired={isRequired}
        mode={mode}
        model={resource}
        pickListName={pickList}
        resource={resource}
      />
    );
  },
  QueryComboBox({
    id,
    resource,
    mode,
    formType,
    field,
    isRequired,
    fieldDefinition: { hasCloneButton, typeSearch },
  }) {
    return field === undefined || !field.isRelationship ? null : (
      <QueryComboBox
        field={field}
        forceCollection={undefined}
        formType={formType}
        hasCloneButton={hasCloneButton}
        id={id}
        isRequired={isRequired}
        mode={mode}
        resource={resource}
        typeSearch={typeSearch}
      />
    );
  },
  Text({
    id,
    resource,
    mode,
    name,
    field,
    isRequired,
    fieldDefinition: { defaultValue, min, max, step, maxLength, minLength },
  }) {
    const parser = React.useMemo<Parser>(
      () => ({
        value: defaultValue,
        min,
        max,
        step,
        required: isRequired,
        maxLength,
        minLength,
      }),
      [defaultValue, min, max, step, isRequired, maxLength, minLength]
    );
    return (
      <UiField
        field={field}
        id={id}
        mode={mode}
        name={name}
        parser={parser}
        resource={resource}
      />
    );
  },
  Plugin: FormPlugin,
  Blank: () => null,
};

export function FormField({
  mode,
  resource,
  fields,
  fieldDefinition: { isReadOnly, ...fieldDefinition },
  ...rest
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly mode: FormMode;
  readonly id: string | undefined;
  readonly fieldDefinition: FormFieldDefinition;
  readonly fields: RA<LiteralField | Relationship> | undefined;
  readonly isRequired: boolean;
  readonly formType: FormType;
}): JSX.Element {
  const Render = fieldRenderers[
    fieldDefinition.type
  ] as typeof fieldRenderers.Checkbox;

  const data = useDistantRelated(resource, fields);

  const isIndependent =
    fields
      ?.slice(0, -1)
      .some((field) => field.isRelationship && !field.isDependent()) ?? false;
  return (
    <ErrorBoundary dismissible>
      {data === undefined ? undefined : (
        <Render
          mode={
            isReadOnly || data.resource === undefined || isIndependent
              ? 'view'
              : mode
          }
          {...rest}
          field={data.field}
          fieldDefinition={fieldDefinition as FieldTypes['Checkbox']}
          isRequired={rest.isRequired && mode !== 'search'}
          name={fields?.map(({ name }) => name).join('.')}
          resource={data.resource}
        />
      )}
    </ErrorBoundary>
  );
}
