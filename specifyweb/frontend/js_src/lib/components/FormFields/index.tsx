import React from 'react';

import { useResourceValue } from '../../hooks/useResourceValue';
import type { Parser } from '../../utils/parser/definitions';
import { getValidationAttributes } from '../../utils/parser/definitions';
import type { IR, RA } from '../../utils/types';
import { Input, Textarea } from '../Atoms/Form';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import type { FormMode, FormType } from '../FormParse';
import type { FieldTypes, FormFieldDefinition } from '../FormParse/fields';
import { FormPlugin } from '../FormPlugins';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { usePref } from '../UserPreferences/usePref';
import { PrintOnSave, SpecifyFormCheckbox } from './Checkbox';
import { Combobox } from './ComboBox';
import { UiField } from './Field';
import { QueryComboBox } from './QueryComboBox';
import { useDistantRelated } from '../../hooks/resource';

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

    const [autoGrow] = usePref('form', 'behavior', 'textAreaAutoGrow');
    const Component =
      autoGrow && formType !== 'formTable' ? AutoGrowTextArea : Textarea;

    return (
      <Component
        {...validationAttributes}
        forwardRef={validationRef}
        id={id}
        isReadOnly={mode === 'view' || field === undefined}
        name={name}
        required={'required' in validationAttributes && mode !== 'search'}
        rows={rows}
        value={value?.toString() ?? ''}
        onBlur={(): void => updateValue(value?.toString() ?? '')}
        onValueChange={(value): void => updateValue(value, false)}
      />
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
        name={name}
        id={id}
        mode={mode}
        parser={parser}
        resource={resource}
      />
    );
  },
  Plugin: FormPlugin,
  FilePicker({ id, mode, name, isRequired }) {
    // FEATURE: consider replacing this with AttachmentsPlugin for some field names
    /*
     * Not sure how this is supposed to work, thus the field is rendered as
     * disabled
     *
     * Probably could overwrite the behaviour on case-by-case basis depending
     * on the fieldName
     */
    return (
      <Input.Generic
        disabled
        id={id}
        isReadOnly={mode === 'view'}
        name={name}
        required={isRequired}
        type="file"
      />
    );
  },
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
  return (
    <ErrorBoundary dismissible>
      {data === undefined ? undefined : (
        <Render
          mode={isReadOnly || data.resource !== resource ? 'view' : mode}
          {...rest}
          field={data.field}
          name={fields?.map(({ name }) => name).join('.')}
          fieldDefinition={fieldDefinition as FieldTypes['Checkbox']}
          isRequired={rest.isRequired && mode !== 'search'}
          resource={data.resource}
        />
      )}
    </ErrorBoundary>
  );
}
