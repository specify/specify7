import React from 'react';
import _ from 'underscore';

import type { IR, RA } from '../types';
import { useId } from './hooks';

let dataListCount = 0;
const debounceRate = 300;
const defaultLimit = 100;

type Items<T> = RA<string> | IR<{ readonly label: string; readonly data: T }>;

export function Autocomplete<T>({
  source,
  minLength = 1,
  delay = debounceRate,
  onChange: handleChange,
  onNewValue: handleNewValue,
  children,
}: {
  readonly source: Items<T> | ((value: string) => Promise<Items<T>>);
  readonly minLength?: number;
  readonly delay?: number;
  readonly onNewValue?: (value: string) => void;
  readonly onChange: (
    value: string,
    selected: {
      readonly label: string;
      readonly data: T;
    }
  ) => void;
  readonly children: (props: {
    readonly type: 'search';
    readonly autoComplete: 'on';
    readonly list: string;
    readonly onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    readonly onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    readonly onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  }) => JSX.Element;
}): JSX.Element {
  const id = useId('autocomplete-data-list');
  const [results, setResults] = React.useState<
    IR<{ readonly label: string; readonly data: T }>
  >({});
  const refDataList = React.useRef<HTMLDataListElement | null>(null);

  const updateResults = React.useCallback(function updateResults(
    values: Items<T>
  ): void {
    const entries = Object.entries(values);
    setResults((oldResults) =>
      // Don't delete previous autocomplete results if no new results returned
      Object.keys(oldResults).length > 0 && entries.length === 0
        ? oldResults
        : Array.isArray(values)
        ? Object.fromEntries(
            entries.map((value) => [
              value,
              {
                label: value,
                data: value,
              },
            ])
          )
        : values
    );

    return undefined;
  },
  []);

  // Update source array on changes if statically supplied
  React.useEffect(() => {
    if (Array.isArray(source)) updateResults(source);
  }, [source, updateResults]);

  function onKeyDown({ target }: React.KeyboardEvent): void {
    if (typeof source !== 'function') return;

    const input = target as HTMLInputElement;
    if (input.value.length < minLength) return;

    void source(input.value).then(updateResults).catch(console.error);
  }

  const handleKeyDown = React.useCallback(_.debounce(onKeyDown, delay), []);

  return (
    <>
      {children({
        type: 'search',
        autoComplete: 'on',
        list: id(''),
        onKeyDown: handleKeyDown,
        onChange: ({ target }): void => {
          const input = target as HTMLInputElement;
          const data = results[input.value] ?? results[input.value.trim()];
          if (typeof data === 'object') handleChange(input.value, data);
        },
        onBlur: ({ target }): void => {
          const input = target as HTMLInputElement;
          const data = results[input.value] ?? results[input.value.trim()];
          if (typeof data === 'undefined' && input.value.length > 0)
            handleNewValue?.(input.value);
        },
      })}
      <datalist id={id('')} ref={refDataList}>
        {Object.entries(results).map(([value, { label }]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </datalist>
    </>
  );
}

export function autocomplete({
  input,
  source,
  minLength = 1,
  delay = debounceRate,
  // Don't reQuery items on input
  isStatic = false,
  // Max number of entries
  limit = defaultLimit,
}: {
  readonly input: HTMLInputElement;
  readonly source: (value: string) => Promise<RA<string> | IR<string>>;
  readonly minLength?: number;
  readonly delay?: number;
  readonly isStatic?: boolean;
  readonly limit?: number;
}): () => void {
  const id = `autocomplete-data-list=${dataListCount}`;
  dataListCount += 1;

  const dataList = document.createElement('datalist');
  dataList.id = id;
  input.setAttribute('list', id);
  const container = input.parentElement;
  if (container === null) throw new Error('Input has no parent element');
  container.append(dataList);
  let lastValue: string | undefined = undefined;

  function eventHandler(): void {
    if (input.value.length < minLength || input.value === lastValue) return;

    source(input.value)
      .then((values) => {
        const useKeys = !Array.isArray(values);
        const entries = Object.entries(values);

        // Don't delete previous autocomplete results if no new results returned
        if (dataList.childElementCount > 0 && entries.length === 0)
          return undefined;

        if (input.value === lastValue) return undefined;
        lastValue = input.value;

        dataList.textContent = '';
        const fragment = document.createDocumentFragment();
        entries.slice(0, limit).forEach(([value, label]) => {
          const option = document.createElement('option');
          if (useKeys) {
            option.value = value;
            option.textContent = label;
          } else option.value = label;
          fragment.append(option);
        });
        dataList.append(fragment);
        return undefined;
      })
      .catch(console.error);
  }

  eventHandler();
  const throttledHandler = _.debounce(eventHandler, delay);
  if (!isStatic) input.addEventListener('keydown', throttledHandler);
  return (): void => {
    if (!isStatic) input.removeEventListener('keydown', throttledHandler);
    dataList.remove();
    input.removeAttribute('list');
  };
}
