/**
 * An accessible autocomplete.
 * Previous implementation (see Git history) used <datalist> to provide
 * autocomplete suggestions.
 * While that had accessibility backed in, Firefox has a number of bugs
 * with it's datalist implementation.
 * Plus, that solution did not allow for displaying an "Add" option
 * if no search results come up
 *
 * Consider revisiting <datalist> once browser support is improved
 */

import React from 'react';
import _ from 'underscore';

import commonText from '../localization/common';
import type { RA } from '../types';
import { ensure } from '../types';
import type { TagProps } from './basic';
import { useBooleanState, useId, useTriggerState } from './hooks';

const debounceRate = 300;

type Item<T> = {
  readonly label: string;
  readonly subLabel?: string;
  readonly icon?: JSX.Element;
  readonly data: T;
};

export function Autocomplete<T>({
  source,
  minLength = 1,
  delay = debounceRate,
  forwardRef,
  onChange: handleChange,
  onNewValue: handleNewValue,
  children,
  'aria-label': ariaLabel,
  value: currentValue,
}: {
  readonly source: RA<Item<T>> | ((value: string) => Promise<RA<Item<T>>>);
  readonly minLength?: number;
  readonly delay?: number;
  readonly onNewValue?: (value: string) => void;
  readonly onChange: (item: Item<T>) => void;
  readonly forwardRef?: React.Ref<HTMLInputElement>;
  readonly children: (props: {
    readonly forwardRef: React.RefCallback<HTMLInputElement>;
    readonly value: string;
    readonly type: 'search';
    readonly autoComplete: 'off';
    readonly 'aria-expanded': boolean;
    readonly 'aria-autocomplete': 'list';
    readonly 'aria-controls': string;
    readonly 'aria-label': string | undefined;
    readonly onClick: () => void;
    readonly onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    readonly onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  }) => JSX.Element;
  readonly 'aria-label': string | undefined;
  readonly value: string;
}): JSX.Element {
  const id = useId('autocomplete-data-list')('');
  const [results, setResults] = React.useState<RA<Item<T>>>([]);

  const updateItems = React.useCallback(
    (items: RA<Item<T>>): void =>
      setResults((oldItems) =>
        // Don't delete previous autocomplete results if no new results returned
        oldItems.length > 0 && items.length === 0 ? oldItems : items
      ),
    []
  );

  // Update source array on changes if statically supplied
  React.useEffect(() => {
    if (Array.isArray(source)) updateItems(source);
  }, [source, updateItems]);

  const [isLoading, handleLoading, handleLoaded] = useBooleanState();
  const previousValue = React.useRef<string>(currentValue);
  const handleRefreshItems = React.useCallback(
    _.debounce(function onKeyDown({ target }: React.KeyboardEvent): void {
      const input = target as HTMLInputElement;

      if (typeof source !== 'function' || previousValue.current === input.value)
        return;

      handleLoading();
      previousValue.current = input.value;

      if (input.value.length < minLength) return;

      void source(input.value)
        .then(updateItems)
        .catch(console.error)
        .finally(handleLoaded);
    }, delay),
    []
  );

  const [isOpen, handleOpen, handleClose, handleToggle] = useBooleanState();

  const [input, setInput] = React.useState<HTMLInputElement | null>(null);
  const dataListRef = React.useRef<HTMLUListElement | null>(null);

  const [currentIndex, setCurrentIndex] = React.useState<number>(-1);
  const [pendingValue, setPendingValue] = useTriggerState<string>(currentValue);
  const [filteredItems, setFilteredItems] = React.useState<RA<Item<T>>>([]);

  function handleKeyDown(
    key: string,
    newFilteredItems: RA<Item<T>> = filteredItems
  ): void {
    let newIndex = currentIndex;
    if (key === 'Escape' || key === 'Enter') {
      const newItem = newFilteredItems[currentIndex];
      if (typeof newItem === 'object') handleChange(newItem);
      handleClose();
      input?.focus();
    } else if (key === 'ArrowUp') newIndex = Math.max(currentIndex - 1, -1);
    else if (key === 'ArrowDown') newIndex = currentIndex + 1;

    if (newIndex !== currentIndex) {
      const finalIndex =
        (newFilteredItems.length + newIndex) % newFilteredItems.length;
      setCurrentIndex(finalIndex);
      (dataListRef.current?.children?.[finalIndex] as HTMLElement)?.focus();
    }
  }

  /*
   * TODO: test this with ç
   * TODO: review here and usages to make sure value is what is saved in the DB
   *       and label is what is being searched on
   * TODO: allow sublabel
   * TODO: allow icon
   */

  const itemProps = ensure<Partial<TagProps<'li'>>>()({
    className: `p-0.5 hover:text-brand-200 active:text-brand-300 bg-neutral-600/50
      hover:bg-neutral-700/50 disabled:cursor-default`,
    role: 'options',
    tabIndex: -1,
  } as const);

  const filterItems = (pendingValue: string) =>
    results.filter(({ label }) =>
      label.localeCompare(
        pendingValue.slice(0, label.length),
        window.navigator.language,
        { sensitivity: 'base' }
      )
    );
  const findItem = (filteredItems: RA<Item<T>>, pendingValue: string) =>
    filteredItems.find(({ label }) =>
      label.localeCompare(
        pendingValue.slice(0, label.length),
        window.navigator.language,
        { sensitivity: 'base' }
      )
    );

  return (
    <div className="relative">
      {children({
        forwardRef(input): void {
          setInput(input);
          if (typeof forwardRef === 'object' && forwardRef !== null)
            // @ts-expect-error Assigning to ref manually
            forwardRef.current = input;
          else if (typeof forwardRef === 'function') forwardRef(input);
        },
        value: pendingValue,
        type: 'search',
        autoComplete: 'off',
        'aria-expanded': isOpen,
        'aria-autocomplete': 'list',
        'aria-controls': id,
        'aria-label': ariaLabel,
        onKeyDown: (event) => {
          const input = event.target as HTMLInputElement;
          handleRefreshItems(event);
          const filteredItems = filterItems(input.value);
          setFilteredItems(filteredItems);
          if (isOpen) handleKeyDown(event.key, filteredItems);
          else handleOpen();
          const item = findItem(filteredItems, input.value);
          if (typeof item === 'object') handleChange(item);
          else setPendingValue(input.value);
        },
        onClick: handleToggle,
        onBlur: ({ target, relatedTarget }): void => {
          if (relatedTarget !== dataListRef.current) handleClose();
          const item = findItem(filteredItems, pendingValue);
          if (typeof item === 'undefined' && target.value.length > 0)
            if (typeof handleNewValue === 'function')
              handleNewValue?.(target.value);
            else setPendingValue('');
        },
      })}
      <ul
        className="backdrop-blur-2xl absolute z-10 w-full rounded cursor-pointer"
        role="listbox"
        aria-label={ariaLabel}
        id={id}
        ref={dataListRef}
        onKeyDown={(event): void => {
          // Meta keys
          if (['Space', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key))
            handleKeyDown(event.key);
          else {
            input?.focus();
            input?.dispatchEvent(event.nativeEvent);
          }
        }}
        onBlur={({ relatedTarget }): void =>
          relatedTarget === input ? undefined : handleClose()
        }
      >
        {filteredItems.length === 0 ? (
          isLoading ? (
            <li aria-selected={false} aria-disabled={true} {...itemProps}>
              {commonText('loading')}
            </li>
          ) : typeof handleNewValue === 'function' &&
            pendingValue.length > 0 ? (
            <li
              aria-selected={false}
              aria-posinset={1}
              aria-setsize={1}
              onClick={(): void => handleNewValue(pendingValue)}
            >
              {/* TODO: icon */}
              {commonText('add')}
            </li>
          ) : undefined
        ) : (
          filteredItems.map((item, index, { length }) => (
            <li
              key={index}
              aria-posinset={index + 1}
              aria-setsize={length}
              aria-selected={index === currentIndex}
              onClick={(): void => {
                handleChange(item);
                setPendingValue(item.label);
                handleClose();
              }}
              {...itemProps}
            >
              {/* TODO: icon */}
              {/* TODO: sublabel */}
              {item.label}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
