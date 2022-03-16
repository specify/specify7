import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { Input } from './basic';
import { useResourceValue } from './hooks';
import { useCachedState } from './stateCache';

export function PrintOnSave({
  id,
  name,
}: {
  readonly id: string | undefined;
  readonly name: string | undefined;
}): JSX.Element {
  const [value, setValue] = useCachedState({
    bucketName: 'forms',
    cacheName: 'printOnSave',
    bucketType: 'localStorage',
    defaultValue: false,
  });
  return (
    <Input.Checkbox
      id={id}
      name={name}
      checked={value ?? false}
      onValueChange={setValue}
    />
  );
}

export function SpecifyFormCheckbox({
  id,
  resource,
  fieldName,
  defaultValue,
  isRequired,
  isReadOnly,
}: {
  readonly id: string | undefined;
  readonly resource: SpecifyResource<AnySchema>;
  readonly fieldName: string;
  readonly defaultValue: boolean | undefined;
  readonly isRequired: boolean;
  readonly isReadOnly: boolean;
}): JSX.Element {
  const { value, updateValue, validationRef } = useResourceValue<boolean>(
    resource,
    fieldName,
    React.useMemo(() => ({ value: defaultValue }), [defaultValue])
  );
  return (
    <Input.Checkbox
      forwardRef={validationRef}
      id={id}
      name={fieldName}
      checked={value}
      onValueChange={updateValue}
      required={isRequired}
      readOnly={isReadOnly}
    />
  );
}
