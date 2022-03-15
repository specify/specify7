import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { Input } from './basic';
import { useResourceValue } from './specifyformfield';
import { useCachedState } from './stateCache';

export function PrintOnSave({
  id,
  name,
}: {
  readonly id: string | undefined;
  readonly name: string;
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
  const [value = false, setValue] = useResourceValue<boolean>(
    resource,
    fieldName,
    defaultValue
  );
  return (
    <Input.Checkbox
      id={id}
      name={fieldName}
      checked={value}
      onValueChange={setValue}
      required={isRequired}
      readOnly={isReadOnly}
    />
  );
}
