import React from 'react';

import { useResourceValue } from '../../hooks/useResourceValue';
import { commonText } from '../../localization/common';
import type { Parser } from '../../utils/parser/definitions';
import {
  getValidationAttributes,
  mergeParsers,
} from '../../utils/parser/definitions';
import type { IR } from '../../utils/types';
import { Input } from '../Atoms/Form';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import { raise } from '../Errors/Crash';
import { fetchPathAsString } from '../Formatters/formatters';
import type { FormMode } from '../FormParse';
import { usePref } from '../UserPreferences/usePref';

export function UiField({
  field,
  ...props
}: {
  readonly id: string | undefined;
  readonly name: string | undefined;
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly mode: FormMode;
  readonly field: LiteralField | Relationship | undefined;
  readonly parser?: Parser;
}): JSX.Element {
  return field?.isRelationship === true ? (
    <RelationshipField field={field} {...props} />
  ) : (
    <Field field={field} {...props} />
  );
}

/*
 * If tried to render a -to-many relationship, display a readOnly aggregated
 * collection
 * Display -to-one as a formatted field
 */
function RelationshipField({
  resource,
  field,
  id,
  name,
}: {
  readonly id: string | undefined;
  readonly name: string | undefined;
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly field: Relationship;
}): JSX.Element {
  const [formatted, setFormatted] = React.useState<string | false | undefined>(
    undefined
  );
  React.useEffect(() => {
    if (resource === undefined) return undefined;
    let destructorCalled = false;
    const handleChange = (): void =>
      void fetchPathAsString(resource, [field])
        .then((value) =>
          destructorCalled ? undefined : setFormatted(value ?? false)
        )
        .catch(raise);

    const destructor = resourceOn(
      resource,
      `change:${field.name}`,
      handleChange,
      true
    );
    return (): void => {
      destructor();
      destructorCalled = true;
    };
  }, [resource, field]);

  return (
    <Input.Text
      id={id}
      isReadOnly
      name={name}
      value={
        formatted === undefined
          ? commonText.loading()
          : formatted === false
          ? ''
          : formatted.toString()
      }
    />
  );
}

function Field({
  resource,
  id,
  name,
  field,
  mode,
  parser: defaultParser,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly id: string | undefined;
  readonly name: string | undefined;
  readonly field: LiteralField | undefined;
  readonly mode: FormMode;
  readonly parser?: Parser;
}): JSX.Element {
  const { value, updateValue, validationRef, parser } = useResourceValue(
    resource,
    field,
    defaultParser
  );

  const [validationAttributes, setAttributes] = React.useState<IR<string>>({});
  React.useEffect(
    () =>
      setAttributes(
        getValidationAttributes(mergeParsers(parser, defaultParser ?? {}))
      ),
    [parser, defaultParser]
  );

  const isReadOnly =
    mode === 'view' || (field?.isReadOnly === true && mode !== 'search');

  const [rightAlignNumberFields] = usePref(
    'form',
    'ui',
    'rightAlignNumberFields'
  );
  return (
    <Input.Generic
      forwardRef={validationRef}
      name={name}
      {...validationAttributes}
      // This is undefined when resource.noValidation = true
      className={
        validationAttributes.type === 'number' &&
        rightAlignNumberFields &&
        globalThis.navigator.userAgent.toLowerCase().includes('webkit')
          ? `text-right ${isReadOnly ? '' : 'pr-6'}`
          : ''
      }
      id={id}
      isReadOnly={isReadOnly}
      /*
       * Update data model value before onBlur, as onBlur fires after onSubmit
       * if form is submitted using the ENTER key
       */
      required={'required' in validationAttributes && mode !== 'search'}
      tabIndex={isReadOnly ? -1 : undefined}
      type={validationAttributes.type ?? 'text'}
      /*
       * Disable "text-align: right" in non webkit browsers
       * as they don't support spinner's arrow customization
       */
      value={value?.toString() ?? ''}
      onBlur={
        isReadOnly ? undefined : ({ target }): void => updateValue(target.value)
      }
      onChange={(event): void => {
        const input = event.target as HTMLInputElement;
        /*
         * Don't show validation errors on value change for input fields until
         * field is blurred, unless user tried to paste a date (see definition
         * of Input.Generic)
         */
        updateValue(input.value, event.type === 'paste');
      }}
    />
  );
}
