import React from 'react';

import type { AnySchema } from '../datamodelutils';
import { aggregate, format } from '../dataobjformatters';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import type { FormMode } from '../parseform';
import { QueryFieldSpec } from '../queryfieldspec';
import { parseRelativeDate } from '../relativedate';
import type { LiteralField, Relationship } from '../specifyfield';
import type { Collection } from '../specifymodel';
import type { IR } from '../types';
import type { Parser } from '../uiparse';
import {
  getValidationAttributes,
  mergeParsers,
  parserFromType,
} from '../uiparse';
import { relationshipIsToMany } from '../wbplanviewmappinghelper';
import { Input } from './basic';
import { useAsyncState, useResourceValue } from './hooks';
import { PartialDateUi } from './partialdateui';
import { getResourceAndField } from './resource';
import { SpecifyFormCheckbox } from './specifyformcheckbox';

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

  /*
   * If tried to render a -to-many field, display a readOnly aggregated
   * collection
   */
  const [aggregated] = useAsyncState(
    React.useCallback(
      async () =>
        typeof data === 'object' && typeof fieldName === 'string'
          ? 'models' in data.resource
            ? aggregate(data.resource as unknown as Collection<AnySchema>)
            : QueryFieldSpec.fromPath([
                resource.specifyModel.name,
                ...fieldName.split('.'),
              ]).joinPath.some(
                (field) => field.isRelationship && relationshipIsToMany(field)
              )
            ? data.resource.rgetCollection(data.field.name).then(aggregate)
            : false
          : undefined,
      [resource.specifyModel.name, data, fieldName]
    ),
    false
  );

  const fieldType = React.useMemo(
    () =>
      typeof data === 'object' && !data.field.isRelationship
        ? parserFromType(data.field.type).type
        : undefined,
    [data]
  );

  const defaultDate = React.useMemo(
    () =>
      f.maybe(
        parser?.value?.toString().trim().toLowerCase(),
        parseRelativeDate
      ),
    [parser?.value]
  );

  return typeof data === 'undefined' ? (
    <Input.Text disabled id={id} value={aggregated?.toString() ?? ''} />
  ) : fieldType === 'date' ? (
    <PartialDateUi
      resource={data.resource}
      dateField={data.field.name}
      precisionField={undefined}
      defaultPrecision="full"
      defaultValue={defaultDate}
      isReadOnly={mode !== 'edit' || data.resource !== resource}
      id={id}
      canChangePrecision={false}
    />
  ) : fieldType === 'checkbox' ? (
    <SpecifyFormCheckbox
      id={id}
      resource={data.resource}
      fieldName={data.field.name}
      defaultValue={
        parser?.value === true ||
        // Not sure if this branch can ever happen:
        parser?.value?.toString().toLowerCase() === 'true'
      }
      isReadOnly={resource !== data.resource}
      text={undefined}
    />
  ) : aggregated === false ? (
    <Field
      id={id}
      model={resource}
      resource={data.resource}
      field={data.field}
      parser={parser}
      mode={mode}
    />
  ) : (
    <Input.Text disabled id={id} value={aggregated?.toString() ?? ''} />
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
        getValidationAttributes(mergeParsers(parser, defaultParser ?? {}))
      ),
    [parser, defaultParser]
  );

  const isReadOnly =
    mode === 'view' ||
    resource !== model ||
    field?.isRelationship === true ||
    (field?.isReadOnly === true && mode !== 'search');

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
      /*
       * While "value" is not used in the hook, it is needed to update a
       * formatter if related resource changes
       */
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [resource, field, value]
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
      /*
       * Update data model value before onBlur, as onBlur fires after onSubmit
       * if form is submitted using the ENTER key
       */
      onChange={(event): void => {
        const input = event.target as HTMLInputElement;
        /*
         * Don't show validation errors on value change for input fields until
         * field is blurred, unless user tried to paste a date (see definition
         * of Input.Generic)
         */
        updateValue(input.value, event.type === 'paste');
      }}
      onBlur={({ target }): void => updateValue(target.value)}
      id={id}
      /*
       * Disable "text-align: right" in non webkit browsers
       * as they don't support spinner's arrow customization
       */
      className={navigator.userAgent.includes('webkit') ? 'webkit' : ''}
      {...validationAttributes}
      // This is undefined when resource.noValidation = true
      type={validationAttributes.type ?? 'text'}
      isReadOnly={isReadOnly}
      required={'required' in validationAttributes && mode !== 'search'}
    />
  );
}
