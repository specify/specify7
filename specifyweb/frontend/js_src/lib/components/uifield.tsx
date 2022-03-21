import React from 'react';

import type { AnySchema } from '../datamodelutils';
import { format } from '../dataobjformatters';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import type { FormMode } from '../parseform';
import type { LiteralField, Relationship } from '../specifyfield';
import type { IR } from '../types';
import type { Parser } from '../uiparse';
import { getValidationAttributes, mergeParsers } from '../uiparse';
import { Input } from './basic';
import { useAsyncState, useResourceValue } from './hooks';
import { getResourceAndField } from './resource';

export function UiField({
  id,
  resource,
  mode,
  fieldName,
  parser,
}: {
  readonly id: string | undefined;
  readonly resource: SpecifyResource<AnySchema>;
  readonly mode: FormMode;
  readonly fieldName: string | undefined;
  readonly parser?: Parser;
}): JSX.Element {
  const [data] = useAsyncState(
    React.useCallback(
      async () => getResourceAndField(resource, fieldName),
      [resource, fieldName]
    ),
    false
  );
  return typeof data === 'undefined' ? (
    <Input.Text disabled id={id} />
  ) : (
    <Field
      id={id}
      model={resource}
      resource={data.resource}
      field={data.field}
      parser={parser}
      mode={mode}
    />
  );
}

export function Field({
  id,
  resource,
  model,
  mode,
  field,
  parser: defaultParser,
}: {
  readonly id: string | undefined;
  readonly resource: SpecifyResource<AnySchema>;
  readonly model?: SpecifyResource<AnySchema>;
  readonly mode: FormMode;
  readonly field: LiteralField | Relationship | undefined;
  readonly parser?: Parser;
}): JSX.Element {
  const { value, updateValue, validationRef, parser } = useResourceValue(
    resource,
    field?.name,
    defaultParser
  );

  const [validationAttributes, setAttributes] = React.useState<IR<string>>({});
  React.useEffect(
    () =>
      setAttributes(
        getValidationAttributes(
          mergeParsers(parser, {
            ...defaultParser,
          }) ?? {}
        )
      ),
    [parser, defaultParser]
  );

  const isReadOnly =
    mode === 'view' ||
    resource !== model ||
    field?.isRelationship === true ||
    field?.isReadOnly === true;

  const [formattedRelationship] = useAsyncState(
    React.useCallback(
      () =>
        field?.isRelationship === true
          ? (
              resource.rgetPromise(field.name) as Promise<
                SpecifyResource<AnySchema> | undefined
              >
            )
              .then(format)
              .then((value) => value ?? '')
          : undefined,
      [resource, field]
    ),
    false
  );

  return (
    <Input.Generic
      forwardRef={validationRef}
      name={field?.name}
      value={
        field?.isRelationship === true
          ? formattedRelationship ?? commonText('loading')
          : value?.toString() ?? ''
      }
      tabIndex={isReadOnly ? -1 : undefined}
      onChange={(event): void => {
        const input = event.target as HTMLInputElement;
        /*
         * Don't handle value change for input fields until field is blurred,
         * unless user tried to paste a date (see definition of Input.Generic)
         */
        if (parser.type !== 'date' || event.type === 'paste')
          updateValue(input.value);
        else if (typeof parser.printFormatter === 'function')
          updateValue(parser.printFormatter(input.value));
      }}
      onBlur={({ target }): void => {
        if (parser.type === 'date') updateValue(target.value);
      }}
      id={id}
      className="w-full"
      {...validationAttributes}
      readOnly={isReadOnly}
      required={'required' in validationAttributes && mode !== 'search'}
    />
  );
}
