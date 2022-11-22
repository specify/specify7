import React from 'react';

import { getResourceAndField } from '../../hooks/resource';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useResourceValue } from '../../hooks/useResourceValue';
import type { IR } from '../../utils/types';
import type { Parser } from '../../utils/parser/definitions';
import { getValidationAttributes } from '../../utils/parser/definitions';
import { Input, Textarea } from '../Atoms/Form';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import type { FormMode, FormType } from '../FormParse';
import type { FieldTypes, FormFieldDefinition } from '../FormParse/fields';
import { FormPlugin } from '../FormPlugins';
import { hasPathPermission, hasPermission } from '../Permissions/helpers';
import { PrintOnSave, SpecifyFormCheckbox } from './Checkbox';
import { Combobox, resolvePickListField } from './ComboBox';
import { UiField } from './Field';
import { QueryComboBox } from './QueryComboBox';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { usePref } from '../UserPreferences/usePref';

const fieldRenderers: {
  readonly [KEY in keyof FieldTypes]: (props: {
    readonly resource: SpecifyResource<AnySchema>;
    readonly mode: FormMode;
    readonly fieldDefinition: FieldTypes[KEY];
    readonly id: string | undefined;
    readonly isRequired: boolean;
    readonly fieldName: string | undefined;
    readonly formType: FormType;
  }) => JSX.Element | null;
} = {
  Checkbox({
    id,
    resource,
    mode,
    fieldName,
    fieldDefinition: { defaultValue, printOnSave, label },
  }) {
    if (printOnSave)
      return hasPermission('/report', 'execute') ? (
        <PrintOnSave
          defaultValue={defaultValue}
          fieldName={fieldName}
          id={id}
          model={resource.specifyModel}
          text={label}
        />
      ) : null;
    else if (fieldName === undefined) {
      console.error(
        `Trying to render a checkbox on a ${resource.specifyModel.name} form without a field name`
      );
      return null;
    } else
      return (
        <ErrorBoundary dismissable>
          <SpecifyFormCheckbox
            defaultValue={defaultValue}
            fieldName={fieldName}
            id={id}
            isReadOnly={mode === 'view'}
            resource={resource}
            text={label}
          />
        </ErrorBoundary>
      );
  },
  TextArea({
    id,
    resource,
    mode,
    fieldName,
    isRequired,
    fieldDefinition: { defaultValue, rows },
    formType,
  }) {
    const { value, updateValue, validationRef, parser } = useResourceValue(
      resource,
      fieldName,
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

    if (fieldName === undefined)
      console.error(
        `Trying to render a text area on the ${resource.specifyModel.name} form with unknown field name`,
        { id, defaultValue }
      );

    return (
      <ErrorBoundary dismissable>
        <Component
          {...validationAttributes}
          forwardRef={validationRef}
          id={id}
          isReadOnly={mode === 'view'}
          name={fieldName}
          required={'required' in validationAttributes && mode !== 'search'}
          rows={rows}
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
    fieldName,
    isRequired,
    formType,
    fieldDefinition: { defaultValue, pickList },
  }) {
    const resolvedFieldName = React.useMemo(
      () => resolvePickListField(resource, fieldName),
      [resource, fieldName]
    );
    const [data] = useAsyncState(
      React.useCallback(
        async () =>
          getResourceAndField(resource, resolvedFieldName).then(
            (values) => values ?? false
          ),
        [resource, resolvedFieldName]
      ),
      false
    );
    return (
      <ErrorBoundary dismissable>
        <Combobox
          defaultValue={defaultValue}
          field={data === false ? undefined : data?.field}
          fieldName={data === undefined ? undefined : resolvedFieldName}
          formType={formType}
          id={id}
          isDisabled={false}
          isRequired={isRequired}
          mode={mode}
          model={resource}
          pickListName={data === undefined ? undefined : pickList}
          resource={
            data === false || data === undefined ? resource : data.resource
          }
        />
      </ErrorBoundary>
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
    return typeof fieldName !== 'string' ||
      hasPathPermission(
        resource.specifyModel.name,
        fieldName.split('.'),
        'read'
      ) ? (
      <QueryComboBox
        fieldName={fieldName}
        forceCollection={undefined}
        formType={formType}
        hasCloneButton={hasCloneButton}
        id={id}
        isRequired={isRequired}
        mode={mode}
        relatedModel={undefined}
        resource={resource}
        typeSearch={typeSearch}
      />
    ) : null;
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
      <ErrorBoundary dismissable>
        <UiField
          fieldName={fieldName}
          id={id}
          mode={mode}
          parser={React.useMemo<Parser>(
            () => ({
              value: defaultValue,
              min,
              max,
              step,
              required: isRequired,
            }),
            [defaultValue, min, max, step, isRequired]
          )}
          resource={resource}
        />
      </ErrorBoundary>
    );
  },
  Plugin: FormPlugin,
  FilePicker({ id, mode, fieldName, isRequired }) {
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
        name={fieldName}
        required={isRequired}
        type="file"
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
      fieldDefinition={fieldDefinition as FieldTypes['Checkbox']}
      isRequired={rest.isRequired && mode !== 'search'}
    />
  );
}
