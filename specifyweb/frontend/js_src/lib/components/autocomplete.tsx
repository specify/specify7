import _ from 'underscore';
import * as React from 'react';

import { useId } from './common';
import type { IR, RA } from './types';

let dataListCount = 0;
const debounceRate = 300;
const defaultLimit = 100;

export function Autocomplete<T>({
  source,
  minLength = 1,
  delay = debounceRate,
  onChange: handleChange,
  inputProps,
}: {
  readonly source: (
    value: string
  ) => Promise<RA<string> | IR<{ readonly label: string; readonly data: T }>>;
  readonly minLength?: number;
  readonly delay?: number;
  readonly onChange: (
    value: string,
    selected: {
      readonly label: string;
      readonly data: T;
    }
  ) => void;
  readonly inputProps: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >;
}): JSX.Element {
  const id = useId('autocomplete-data-list');
  const [results, setResults] = React.useState<
    IR<{ readonly label: string; readonly data: T }>
  >({});
  const refDataList = React.useRef<HTMLDataListElement | null>(null);

  async function onKeyDown({ target }: React.KeyboardEvent) {
    const input = target as HTMLInputElement;
    if (input.value.length < minLength) return;

    await source(input.value)
      .then((values) => {
        const entries = Object.entries(values);

        // Don't delete previous autocomplete results if no new results returned
        if (Object.keys(results).length !== 0 && entries.length === 0) return;

        setResults(
          Array.isArray(values)
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
      })
      .catch(console.error);
  }

  const handleKeyDown = React.useCallback(_.debounce(onKeyDown, delay), []);

  return (
    <>
      <input
        type="search"
        autoComplete="on"
        list={id('')}
        onKeyDown={handleKeyDown}
        onChange={({ target }): void => {
          const data = results[target.value];
          if (typeof data !== 'undefined') handleChange(target.value, data);
        }}
        {...inputProps}
      />
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
export default function autocomplete({
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
        if (dataList.childElementCount !== 0 && entries.length === 0) return;

        if (input.value === lastValue) return;
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
