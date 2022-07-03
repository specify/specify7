import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import type { SpecifyModel } from '../specifymodel';
import { Input, Label } from './basic';
import { useResourceValue } from './hooks';
import { FormContext } from './contexts';
import { useCachedState } from './statecache';

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
    category: 'forms',
    key: 'printOnSave',
    defaultValue: defaultValue ?? false,
    staleWhileRefresh: false,
  });
  const [, setFormMeta] = React.useContext(FormContext);
  React.useEffect(
    () =>
      setFormMeta?.((meta) => ({
        ...meta,
        printOnSave: value,
      })),
    [value, setFormMeta]
  );
  const input = (
    <Input.Checkbox
      id={id}
      name={fieldName}
      checked={value ?? false}
      onValueChange={setValue}
    />
  );
  return typeof text === 'string' ? (
    <Label.ForCheckbox
      title={model.getField(fieldName ?? '')?.getLocalizedDesc()}
    >
      {input}
      {text}
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
  isReadOnly,
  text,
}: {
  readonly id: string | undefined;
  readonly resource: SpecifyResource<AnySchema>;
  readonly fieldName: string;
  readonly defaultValue: boolean | undefined;
  readonly isReadOnly: boolean;
  readonly text: string | undefined;
}): JSX.Element {
  const { value, updateValue, validationRef } = useResourceValue<boolean>(
    resource,
    fieldName,
    React.useMemo(() => ({ value: defaultValue }), [defaultValue])
  );
  const input = (
    <Input.Checkbox
      forwardRef={validationRef}
      id={id}
      name={fieldName}
      checked={value ?? false}
      onValueChange={updateValue}
      isReadOnly={
        isReadOnly || resource.specifyModel.getField(fieldName)?.isReadOnly
      }
      // Checkbox cannot be required as checkbox does not have a "null" state
    />
  );
  return typeof text === 'string' ? (
    <Label.ForCheckbox
      title={resource.specifyModel
        .getField(fieldName ?? '')
        ?.getLocalizedDesc()}
    >
      {input}
      {text}
    </Label.ForCheckbox>
  ) : (
    input
  );
}
