import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { localizeLabel } from '../localizeform';
import type { SpecifyModel } from '../specifymodel';
import { Input, Label } from './basic';
import { useResourceValue } from './hooks';
import { FormContext } from './resourceview';
import { useCachedState } from './stateCache';

export function PrintOnSave({
  id,
  fieldName,
  model,
  text,
  defaultValue,
}: {
  readonly id: string | undefined;
  readonly fieldName: string | undefined;
  readonly model: SpecifyModel;
  readonly text: string | undefined;
  readonly defaultValue: boolean | undefined;
}): JSX.Element {
  const [value, setValue] = useCachedState({
    bucketName: 'forms',
    cacheName: 'printOnSave',
    bucketType: 'localStorage',
    defaultValue: defaultValue ?? false,
  });
  const [, setFormMeta] = React.useContext(FormContext);
  React.useEffect(
    () =>
      setFormMeta((meta) => ({
        ...meta,
        printOnSave: value,
      })),
    [value, setFormMeta]
  );
  const { children, title } = localizeLabel({
    text,
    id,
    fieldName,
    model,
  });
  const input = (
    <Input.Checkbox
      id={id}
      name={fieldName}
      checked={value ?? false}
      onValueChange={setValue}
    />
  );
  return children.length > 0 ? (
    <Label.ForCheckbox title={title}>
      {input}
      {children}
    </Label.ForCheckbox>
  ) : (
    input
  );
}

export function SpecifyFormCheckbox({
  id,
  resource,
  fieldName,
  defaultValue,
  isRequired,
  isReadOnly,
  text,
}: {
  readonly id: string | undefined;
  readonly resource: SpecifyResource<AnySchema>;
  readonly fieldName: string;
  readonly defaultValue: boolean | undefined;
  readonly isRequired: boolean;
  readonly isReadOnly: boolean;
  readonly text: string | undefined;
}): JSX.Element {
  const { value, updateValue, validationRef } = useResourceValue<boolean>(
    resource,
    fieldName,
    React.useMemo(() => ({ value: defaultValue }), [defaultValue])
  );
  const { children, title } = localizeLabel({
    text,
    id,
    fieldName,
    model: resource.specifyModel,
  });
  const input = (
    <Input.Checkbox
      forwardRef={validationRef}
      id={id}
      name={fieldName}
      checked={value ?? false}
      disabled={typeof value === 'undefined'}
      onValueChange={updateValue}
      required={isRequired}
      readOnly={isReadOnly}
    />
  );
  return children.length > 0 ? (
    <Label.ForCheckbox title={title}>
      {input}
      {children}
    </Label.ForCheckbox>
  ) : (
    input
  );
}
