import React from 'react';

import { aggregate, format } from '../Forms/dataObjFormatters';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import type { FormMode } from '../FormParse';
import { hasTablePermission } from '../Permissions/helpers';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { Collection } from '../DataModel/specifyModel';
import type { IR } from '../../utils/types';
import type { Parser } from '../../utils/parser/definitions';
import {
  getValidationAttributes,
  mergeParsers,
} from '../../utils/parser/definitions';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { Input } from '../Atoms/Form';
import { useResourceValue } from '../../hooks/useResourceValue';
import { useAsyncState } from '../../hooks/useAsyncState';
import { AnySchema } from '../DataModel/helperTypes';
import { usePref } from '../UserPreferences/usePref';
import { userText } from '../../localization/user';

export function UiField({
  id,
  name,
  resource,
  mode,
  field,
  parser,
}: {
  readonly id: string | undefined;
  readonly name: string | undefined;
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly mode: FormMode;
  readonly field: LiteralField | Relationship | undefined;
  readonly parser?: Parser;
}): JSX.Element {
  /*
   * If tried to render a -to-many field, display a readOnly aggregated
   * collection
   */
  const [aggregated] = useAsyncState(
    React.useCallback(
      async () =>
        resource === undefined
          ? false
          : typeof field === 'object'
          ? 'models' in resource
            ? aggregate(resource as unknown as Collection<AnySchema>)
            : field.isRelationship && relationshipIsToMany(field)
            ? resource.rgetCollection(field.name).then(aggregate)
            : false
          : undefined,
      [resource?.specifyModel.name, resource, field]
    ),
    false
  );

  return aggregated === false ? (
    <Field
      field={field}
      id={id}
      name={name}
      mode={mode}
      model={resource}
      parser={parser}
      resource={resource}
    />
  ) : (
    <Input.Text disabled id={id} value={aggregated?.toString() ?? ''} />
  );
}

function Field({
  resource,
  id,
  name,
  field,
  model,
  mode,
  parser: defaultParser,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly id: string | undefined;
  readonly name: string | undefined;
  readonly field: LiteralField | Relationship | undefined;
  readonly model?: SpecifyResource<AnySchema>;
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
    mode === 'view' ||
    resource !== model ||
    field?.isRelationship === true ||
    (field?.isReadOnly === true && mode !== 'search');

  const [formattedRelationship] = useAsyncState(
    React.useCallback(
      () =>
        field?.isRelationship === true
          ? hasTablePermission(field.relatedModel.name, 'read')
            ? (
                resource?.rgetPromise(field.name) as Promise<
                  SpecifyResource<AnySchema> | undefined
                >
              )
                .then(format)
                .then((value) => value ?? '')
            : userText.noPermission()
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
      value={
        field?.isRelationship === true
          ? formattedRelationship ?? commonText.loading()
          : value?.toString() ?? ''
      }
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
