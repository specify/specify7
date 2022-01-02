import React from 'react';

import commonText from '../localization/common';
import type { Input } from '../saveblockers';
import type { R, RA } from '../types';

const idStore: R<number> = {};

export function useId(prefix: string): (suffix: string) => string {
  const id = React.useRef(-1);

  const resolvedPrefix = `${prefix}-`;

  if (!(resolvedPrefix in idStore)) idStore[resolvedPrefix] = 0;

  if (id.current === -1) {
    id.current = idStore[resolvedPrefix];
    idStore[resolvedPrefix] += 1;
  }

  return (suffix = ''): string =>
    `${resolvedPrefix}${id.current}${suffix ? `-${suffix}` : ''}`;
}

export function setTitle(title: string): void {
  window.document.title = commonText('appTitle')(title);
}

export function useTitle(title: string): void {
  // Reset title after component is destroyed
  React.useEffect(() => {
    const initialTitle = document.body.title;
    return (): void => {
      document.body.title = initialTitle;
    };
  }, []);

  // Change page's title
  React.useEffect(() => {
    setTitle(title);
  }, [title]);
}

export function useValidation<T extends Input = HTMLInputElement>(
  message: string | RA<string> = ''
): {
  readonly inputRef: React.MutableRefObject<T | null>;
  readonly setValidation: (message: string) => void;
} {
  const inputRef = React.useRef<T | null>(null);

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
  function setValidation(message: string): void {
    const input = inputRef.current;
    if (!input) return;
    // Show the error message, if present
    input.setCustomValidity(message);
    if (message !== '') input.reportValidity();
  }

  React.useEffect(() => {
    const joined = Array.isArray(message)
      ? message.join('\n')
      : (message as string);
    setValidation(joined);
  }, [message]);

  return {
    inputRef,
    setValidation,
  };
}
