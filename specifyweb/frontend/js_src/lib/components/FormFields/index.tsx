import React from 'react';

import { useDistantRelated } from '../../hooks/resource';
import { useResourceValue } from '../../hooks/useResourceValue';
import type { Parser } from '../../utils/parser/definitions';
import { getValidationAttributes } from '../../utils/parser/definitions';
import type { IR, RA } from '../../utils/types';
import { Textarea } from '../Atoms/Form';
import { ReadOnlyContext, SearchDialogContext } from '../Core/Contexts';
import { backboneFieldSeparator } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import type { FormType } from '../FormParse';
import type { FieldTypes, FormFieldDefinition } from '../FormParse/fields';
import { FormPlugin } from '../FormPlugins';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { userPreferences } from '../Preferences/userPreferences';
import { QueryComboBox } from '../QueryComboBox';
import { PrintOnSave, SpecifyFormCheckbox } from './Checkbox';
import { Combobox } from './ComboBox';
import { UiField } from './Field';

const fieldRenderers: {
  readonly [KEY in keyof FieldTypes]: (props: {
    readonly resource: SpecifyResource<AnySchema> | undefined;
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
    name,
    field,
    fieldDefinition: { defaultValue, printOnSave, label },
  }) {
    const table = resource?.specifyTable ?? field?.table;
    return printOnSave ? (
      table === undefined ? null : (
        <PrintOnSave
          defaultValue={defaultValue}
          field={field}
          id={id}
          name={name}
          table={table}
          text={label}
        />
      )
    ) : field?.isRelationship === true ? null : (
      <SpecifyFormCheckbox
        defaultValue={defaultValue}
        field={field}
        id={id}
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

    const isReadOnly = React.useContext(ReadOnlyContext);
    return (
      <ErrorBoundary dismissible>
        <Component
          {...validationAttributes}
          forwardRef={validationRef}
          id={id}
          isReadOnly={isReadOnly || field === undefined}
          name={name}
          required={'required' in validationAttributes}
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
        pickListName={pickList}
        resource={resource}
      />
    );
  },
  QueryComboBox({
    id,
    resource,
    formType,
    field,
    isRequired,
    fieldDefinition: {
      hasCloneButton,
      typeSearch,
      searchView,
      hasNewButton,
      hasEditButton,
      hasSearchButton,
      hasViewButton,
      defaultRecord,
    },
  }) {
    return field === undefined || !field.isRelationship ? null : (
      <QueryComboBox
        defaultRecord={defaultRecord}
        field={field}
        forceCollection={undefined}
        formType={formType}
        hasCloneButton={hasCloneButton}
        hasEditButton={hasEditButton}
        hasNewButton={hasNewButton}
        hasSearchButton={hasSearchButton}
        hasViewButton={hasViewButton}
        id={id}
        isRequired={isRequired}
        resource={resource}
        searchView={searchView}
        typeSearch={typeSearch}
      />
    );
  },
  Text({
    id,
    resource,
    name,
    field,
    isRequired,
    fieldDefinition: {
      defaultValue,
      min,
      max,
      step,
      maxLength,
      minLength,
      whiteSpaceSensitive,
    },
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
        whiteSpaceSensitive,
      }),
      [
        defaultValue,
        min,
        max,
        step,
        isRequired,
        maxLength,
        minLength,
        whiteSpaceSensitive,
      ]
    );
    return (
      <UiField
        field={field}
        id={id}
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
  resource,
  fields,
  fieldDefinition,
  ...rest
}: {
  readonly resource: SpecifyResource<AnySchema>;
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
  const isReadOnly =
    React.useContext(ReadOnlyContext) || fieldDefinition.isReadOnly;
  const isSearchDialog = React.useContext(SearchDialogContext);
  const isIndependent =
    fields
      ?.slice(0, -1)
      .some((field) => field.isRelationship && !field.isDependent()) ?? false;
  return (
    <ErrorBoundary dismissible>
      {data === undefined ? undefined : (
        <ReadOnlyContext.Provider
          value={isReadOnly || isIndependent || data.resource === undefined}
        >
          <Render
            {...rest}
            field={data.field}
            fieldDefinition={fieldDefinition as FieldTypes['Checkbox']}
            isRequired={rest.isRequired && !isSearchDialog}
            name={fields?.map(({ name }) => name).join(backboneFieldSeparator)}
            resource={data.resource}
          />
        </ReadOnlyContext.Provider>
      )}
    </ErrorBoundary>
  );
}
