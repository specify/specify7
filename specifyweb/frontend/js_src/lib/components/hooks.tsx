import React from 'react';

import type { AnySchema, SerializedModel } from '../datamodelutils';
import { serializeModel } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import type { Input } from '../saveblockers';
import type { R, RA } from '../types';
import { ignoreValidationErrors } from '../validationmessages';

const idStore: R<number> = {};

export function useId(prefix: string): (suffix: string) => string {
  const id = React.useRef(-1);

  const resolvedPrefix = `${prefix}-`;

  if (!(resolvedPrefix in idStore)) idStore[resolvedPrefix] = 0;

  if (id.current === -1) {
    id.current = idStore[resolvedPrefix];
    idStore[resolvedPrefix] += 1;
  }

  return React.useCallback(
    (suffix = ''): string =>
      `${resolvedPrefix}${id.current}${suffix ? `-${suffix}` : ''}`,
    [resolvedPrefix]
  );
}

export function setTitle(title: string): void {
  window.document.title = commonText('appTitle')(title);
}

export function useTitle(title: string): void {
  // Reset title after component is destroyed
  React.useEffect(() => {
    const initialTitle = document.title;
    return (): void => {
      document.title = initialTitle;
    };
  }, []);

  // Change page's title
  React.useEffect(() => {
    setTitle(title);
  }, [title]);
}

/**
 * For performance reasons, this hook does not cause state update when setting
 * validation message. Thus, you can call it on keydown to implement live
 * validation
 */
export function useValidation<T extends Input = HTMLInputElement>(
  // Can set validation message from state or a prop
  message: string | RA<string> = ''
): {
  // Set this as a ref prop on an input
  readonly validationRef: React.RefCallback<T>;
  // If need access to the underlying inputRef, can use this prop
  readonly inputRef: React.MutableRefObject<T | null>;
  // Can set validation message via this callback
  readonly setValidation: (message: string) => void;
} {
  const inputRef = React.useRef<T | null>(null);

  /*
   * Store last validation message in case inputRef.current is null at the moment
   * This happens if setValidation is called for an input that is not currently
   * rendered
   */
  const validationMessageRef = React.useRef<string | RA<string>>(message);

  // Clear validation message on typing
  React.useEffect(() => {
    if (!inputRef.current) return undefined;
    const input = inputRef.current;

    const handleChange = (): void =>
      input.validity.customError ? input.setCustomValidity('') : undefined;

    input.addEventListener('input', handleChange);
    return (): void => input.removeEventListener('input', handleChange);
  }, []);

  // Empty string clears validation error
  function setValidation(message: string | RA<string>): void {
    const joined = Array.isArray(message) ? message.join('\n') : message;
    validationMessageRef.current = joined;

    const input = inputRef.current;
    if (!input) return;
    input.setCustomValidity(joined);

    if (joined !== '' && !ignoreValidationErrors(input)) input.reportValidity();
  }

  React.useEffect(() => setValidation(message), [message]);

  return {
    inputRef,
    validationRef: (input): void => {
      inputRef.current = input;
      setValidation(validationMessageRef.current);
    },
    setValidation,
  };
}

/** Hook for getting save blockers for a model's field */
export function useSaveBlockers<SCHEMA extends AnySchema>({
  model,
  fieldName,
}: {
  readonly model: SpecifyResource<SCHEMA>;
  readonly fieldName: string;
}): string {
  const [errors, setErrors] = React.useState<string>('');
  React.useEffect(() => {
    model.on('blockerschanged', () =>
      setErrors(model.saveBlockers.getFieldErrors(fieldName).join('\n'))
    );
  }, [model, fieldName]);
  return errors;
}

/**
 * A wrapper for Backbone.Resource that integrates with React.useState for
 * easier state tracking
 */
export function useResource<SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA>
): readonly [
  SerializedModel<SCHEMA>,
  (changedResource: SerializedModel<SCHEMA>) => void
] {
  const [object, setObject] = React.useState(() => serializeModel(resource));

  const previousObjectRef = React.useRef<SerializedModel<SCHEMA>>(object);
  React.useEffect(() => {
    Object.entries(object)
      .filter(([key, newValue]) => newValue !== previousObjectRef.current[key])
      .forEach(([key, newValue]) =>
        resource.set<'resource_uri', string>(key, newValue)
      );
    previousObjectRef.current = object;
  }, [resource, object]);

  return [object, setObject];
}
