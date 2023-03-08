import { Combobox } from '@headlessui/react';
import React from 'react';
import _ from 'underscore';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { listen } from '../../utils/events';
import type { RA } from '../../utils/types';
import { DialogContext } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { withHandleBlur } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { compareStrings } from '../Atoms/Internationalization';
import type { TagProps } from '../Atoms/wrapper';
import { softFail } from '../Errors/Crash';
import { Portal } from './Portal';
import { userPreferences } from '../Preferences/userPreferences';

const debounceRate = 300;

export type AutoCompleteItem<T> = {
  readonly label: JSX.Element | string;
  // If label is a JSX.Element, need to provide a string label as a searchValue
  readonly searchValue?: string;
  readonly subLabel?: string;
  readonly icon?: JSX.Element;
  readonly data: T;
};

/**
 * Get the nearest scrollable parent.
 * Adapted from https://stackoverflow.com/a/35940276/8584605
 */
const getScrollParent = (node: Element | undefined): Element =>
  node === undefined
    ? document.body
    : node.scrollHeight > node.clientHeight
    ? node
    : getScrollParent(node.parentElement ?? undefined);

const optionClassName = (isActive: boolean, isSelected: boolean) => `
  p-0.5 active:bg-brand-100 dark:active:bg-brand-500
  disabled:cursor-default rounded ${isSelected ? 'text-brand-300' : ''}
  ${isActive ? 'bg-gray-100 dark:bg-neutral-800' : ''}
`;

// REFACTOR: split this into smaller components
/**
 * An accessible autocomplete.
 *
 * @remarks
 * Previous implementation (see Git history) used <datalist> to provide
 * autocomplete suggestions.
 * While that had accessibility backed in, Firefox has a number of bugs
 * with its datalist implementation.
 * Plus, that solution did not allow for displaying an "Add" option
 * if no search results came up
 *
 * Consider revisiting <datalist> once browser support is improved
 *
 * Accessibility support was designed based on this article:
 * https://a11y-guidelines.orange.com/en/articles/autocomplete-component/
 *
 */
export function AutoComplete<T>({
  source,
  minLength = 1,
  delay = debounceRate,
  forwardRef,
  filterItems: shouldFilterItems,
  onChange: handleChange,
  onNewValue: handleNewValue,
  onCleared: handleCleared,
  disabled = false,
  inputProps = {},
  value: currentValue,
  pendingValueRef,
}: {
  readonly source:
    | RA<AutoCompleteItem<T>>
    | ((value: string) => Promise<RA<AutoCompleteItem<T>>>);
  readonly minLength?: number;
  readonly delay?: number;
  readonly onNewValue?: (value: string) => void;
  readonly onChange: (item: AutoCompleteItem<T>) => void;
  readonly onCleared?: () => void;
  readonly forwardRef?:
    | React.MutableRefObject<HTMLInputElement | null>
    | React.RefCallback<HTMLInputElement>;
  readonly filterItems: boolean;
  readonly disabled?: boolean;
  readonly inputProps?: Omit<
    TagProps<'input'>,
    | 'aria-activedescendant'
    | 'aria-controls'
    | 'aria-expanded'
    | 'disabled'
    | 'onChange'
    | 'onClick'
    | 'onKeyDown'
    | 'readOnly'
    | 'value'
  >;
  readonly value: string;
  /*
   * For low-level access to the value in the input box before user finished
   * typing
   */
  readonly pendingValueRef?: React.MutableRefObject<string>;
}): JSX.Element {
  const [results, setResults] = React.useState<
    RA<AutoCompleteItem<T>> | undefined
  >(undefined);
  const resultsRef = React.useRef<RA<AutoCompleteItem<T>> | undefined>(results);

  const [searchAlgorithm] = userPreferences.use(
    'form',
    'autoComplete',
    'searchAlgorithm'
  );

  const filterItems = React.useCallback(
    (newResults: RA<AutoCompleteItem<T>>, pendingValue: string) =>
      pendingValue.length === 0
        ? newResults
        : shouldFilterItems
        ? newResults.filter(({ label, searchValue }) => {
            let searchString =
              typeof label === 'string' ? label : searchValue ?? '';
            let searchQuery = pendingValue;

            if (
              searchAlgorithm === 'contains' ||
              searchAlgorithm === 'startsWith'
            ) {
              searchString = searchString.toLowerCase();
              searchQuery = pendingValue.toLowerCase();
            }

            if (
              searchAlgorithm === 'contains' ||
              searchAlgorithm === 'containsCaseSensitive'
            ) {
              if (searchString.includes(searchQuery)) return true;
            } else if (searchString.startsWith(searchQuery)) return true;

            return (
              typeof searchValue === 'string' &&
              compareStrings(
                searchValue.slice(0, pendingValue.length),
                pendingValue
              ) === 0
            );
          })
        : newResults,
    [shouldFilterItems, searchAlgorithm]
  );

  const updateItems = React.useCallback(
    (items: RA<AutoCompleteItem<T>>, pendingValue: string): void => {
      setResults(items);
      resultsRef.current = items;
      setFilteredItems(filterItems(items, pendingValue));
    },
    [filterItems]
  );

  // Update source array on changes if statically supplied
  React.useEffect(() => {
    if (Array.isArray(source)) updateItems(source, '');
  }, [source, updateItems]);

  const [isLoading, handleLoading, handleLoaded] = useBooleanState();
  const previousValue = React.useRef<string>(currentValue);
  const handleRefreshItems = React.useCallback(
    _.debounce(function onKeyDown(
      fetchItems: typeof source,
      value: string
    ): void {
      if (typeof fetchItems !== 'function' || previousValue.current === value)
        return;

      if (results === undefined) {
        setResults([]);
        resultsRef.current = [];
      }

      previousValue.current = value;

      if (value.length < minLength) return;

      handleLoading();
      void fetchItems(value)
        .then((items) => updateItems(items, value))
        .catch(softFail)
        .finally(handleLoaded);
    },
    delay),
    []
  );

  const [input, setInput] = React.useState<HTMLInputElement | null>(null);
  const dataListRef = React.useRef<HTMLUListElement | null>(null);
  const [dataList, setDataList] = React.useState<HTMLUListElement | null>(null);
  const dataListRefCallback = React.useCallback(
    (dataList: HTMLUListElement | null) => {
      setDataList(dataList);
      dataListRef.current = dataList;
    },
    []
  );

  const [filteredItems, setFilteredItems] = React.useState<
    RA<AutoCompleteItem<T>>
  >([]);

  const [pendingValue, setPendingValue] = useTriggerState<string>(currentValue);
  React.useEffect(() => {
    if (typeof pendingValueRef === 'object')
      pendingValueRef.current ??= currentValue;
  }, [currentValue, pendingValueRef]);
  React.useEffect(
    () => setFilteredItems(filterItems(results ?? [], pendingValue)),
    [pendingValue, filterItems, results]
  );

  /*
   * If a value is already selected and you open a list again, show all results,
   * not just the filtered results. This is because most of the time there is
   * only one element that starts with the current value (the current element),
   * thus the filtered list of items has only one item.
   */
  const ignoreFilter = currentValue === pendingValue;
  const itemSource = ignoreFilter ? results ?? [] : filteredItems;

  const pendingItem = results?.find(
    ({ label, searchValue }) => (searchValue ?? label) === pendingValue
  );
  const showAdd =
    !isLoading &&
    typeof handleNewValue === 'function' &&
    pendingValue !== currentValue &&
    pendingItem === undefined;
  const listHasItems = showAdd || isLoading || itemSource.length > 0;

  function handleChanged(item: AutoCompleteItem<T>): void {
    handleChange(item);
    const value =
      typeof item.label === 'string' ? item.label : item.searchValue ?? '';
    setPendingValue(value);
    if (typeof pendingValueRef === 'object') pendingValueRef.current = value;
  }

  const isInDialog = typeof React.useContext(DialogContext) === 'function';

  const [autoGrowAutoComplete] = userPreferences.use(
    'form',
    'autoComplete',
    'autoGrowAutoComplete'
  );
  /*
   * Reposition the autocomplete box as needed
   * Not handling resize events as onBlur would close the list box on resize
   */
  React.useEffect(() => {
    if (dataList === null || input === null) return undefined;

    /*
     * Assuming height does not change while the list is open for performance
     * reasons
     */
    const listHeight = dataList.getBoundingClientRect().height;

    const scrollableParent = getScrollParent(input);
    const { top: parentTop, bottom: parentBottom } =
      scrollableParent.getBoundingClientRect();

    const {
      left: inputLeft,
      width: inputWidth,
      x: inputStart,
    } = input.getBoundingClientRect();
    dataList.style.left = `${inputLeft}px`;
    if (autoGrowAutoComplete) {
      dataList.style.maxWidth = `${
        (document.body.clientWidth - inputStart) * 0.9
      }px`;
      dataList.style.minWidth = `${inputWidth}px`;
    } else dataList.style.width = `max(${inputWidth}px, 6rem)`;

    function handleScroll({
      target,
    }: {
      readonly target: EventTarget | null;
    }): void {
      if (
        dataList === null ||
        input === null ||
        // If it is the list itself that is being scrolled
        target === dataList
      )
        return;

      const { bottom: inputBottom, top: inputTop } =
        input.getBoundingClientRect();

      /*
       * Hide the list for non screen reader users when it goes below the
       * container so as not to cause content overflow
       */
      const shouldHide = inputTop > parentBottom || inputBottom < parentTop;
      if (shouldHide) dataList.classList.add('sr-only');
      else {
        dataList.classList.remove('sr-only');
        const isOverflowing = inputBottom + listHeight > parentBottom;
        if (isOverflowing) {
          dataList.style.top = '';
          dataList.style.bottom = `${document.body.clientHeight - inputTop}px`;
        } else {
          dataList.style.top = `${inputBottom}px`;
          dataList.style.bottom = '';
        }
      }
    }

    handleScroll({ target: null });

    // REFACTOR: consider using IntersectionObserver and ResizeObserver here
    return listen(globalThis, 'scroll', handleScroll, true);
  }, [dataList, input, isInDialog, autoGrowAutoComplete]);

  const [highlightMatch] = userPreferences.use(
    'form',
    'autoComplete',
    'highlightMatch'
  );

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const forwardChildRef: React.RefCallback<HTMLInputElement> =
    React.useCallback(
      (input): void => {
        setInput(input);
        inputRef.current = input;
        if (typeof forwardRef === 'object' && forwardRef !== null)
          forwardRef.current = input;
        else if (typeof forwardRef === 'function') forwardRef(input);
      },
      [forwardRef]
    );

  const [currentItem, setCurrentItem] = React.useState<
    AutoCompleteItem<T> | string | undefined
  >(undefined);
  React.useLayoutEffect(() => {
    const newCurrentItem = resultsRef.current?.find(
      ({ label, searchValue }) => (searchValue ?? label) === currentValue
    );
    setCurrentItem(
      newCurrentItem === undefined
        ? currentValue
        : (currentItem) =>
            currentItem === undefined ||
            typeof currentItem === 'string' ||
            newCurrentItem.data !== currentItem.data
              ? newCurrentItem
              : currentItem
    );
  }, [currentValue]);

  return (
    <Combobox
      as="div"
      className="relative w-full"
      disabled={disabled}
      nullable
      value={currentItem}
      // Triggers on enter or selects new item
      onChange={(
        value: AutoCompleteItem<T> | string | null | undefined
      ): void => {
        if (value === null || value === undefined) handleCleared?.();
        else if (typeof value === 'string') handleNewValue?.(value);
        else handleChanged(value);
      }}
    >
      <Combobox.Input
        autoComplete="off"
        onChange={({ target }): void => {
          const value = (target as HTMLInputElement).value;
          handleRefreshItems(source, value);
          setPendingValue(value);
          if (typeof pendingValueRef === 'object')
            pendingValueRef.current = value;
        }}
        {...inputProps}
        displayValue={(item: AutoCompleteItem<T> | null): string =>
          typeof item === 'string'
            ? item
            : typeof item?.label === 'string'
            ? item.label
            : item?.searchValue ?? ''
        }
        ref={forwardChildRef}
        onBlur={withHandleBlur(inputProps?.onBlur).onBlur}
        /*
         * Padding for the button. Using "em" so as to match @tailwind/forms
         * styles for <select>
         */
        className={`
          ${className.notTouchedInput}
          ${inputProps.className ?? ''}
          w-full min-w-[theme(spacing.20)] pr-[1.5em]
        `}
      />
      {listHasItems && !disabled ? toggleButton : undefined}
      {/*
       * Portal is needed so that the list can flow outside the bounds
       * of parents with overflow:hidden
       */}
      <Portal>
        <Combobox.Options
          className={`
            fixed z-[10000] max-h-[50vh] w-[inherit] cursor-pointer
            overflow-y-auto rounded rounded bg-white shadow-lg
            shadow-gray-400 dark:border dark:border-gray-500 dark:bg-neutral-900
          `}
          ref={dataListRefCallback}
        >
          {isLoading && (
            <Combobox.Option
              className={`${optionClassName(false, false)} cursor-auto`}
              disabled
              value=""
            >
              {commonText.loading()}
            </Combobox.Option>
          )}
          {itemSource.map((item, index) => {
            /**
             * Highlight relevant part of the string.
             * Note, if item.searchValue and item.value is different,
             * label might not be highlighted even if it matched
             * Also, highlighting might be confusing as it highlights any part
             * of the string (i.e, it behaves like case-insensitive "contains"
             * search), where as the search algorithm might actually be
             * case-sensitive and/or search for values with query as a prefix
             * only
             */
            const stringLabel =
              typeof item.label === 'string' ? item.label : undefined;
            const label =
              typeof stringLabel === 'string' && highlightMatch ? (
                <span>
                  {stringLabel
                    // Convert to lower case as search may be case-insensitive
                    .toLowerCase()
                    .split(pendingValue.toLowerCase())
                    .map((part, index, parts) => {
                      const startIndex = parts
                        .slice(0, index)
                        .join(pendingValue).length;
                      const offsetStartIndex =
                        startIndex + (index === 0 ? 0 : pendingValue.length);
                      const endIndex =
                        startIndex +
                        part.length +
                        (index === 0 ? 0 : pendingValue.length);
                      return (
                        <React.Fragment key={index}>
                          {/* Reconstruct the value in original casing */}
                          {stringLabel.slice(offsetStartIndex, endIndex)}
                          {index + 1 !== parts.length && (
                            <span className="text-brand-300">
                              {stringLabel.slice(
                                endIndex,
                                endIndex + pendingValue.length
                              )}
                            </span>
                          )}
                        </React.Fragment>
                      );
                    })}
                </span>
              ) : (
                item.label
              );
            const fullLabel =
              typeof item.subLabel === 'string' ? (
                <div className="flex flex-col justify-center">
                  {label}
                  <span className="text-gray-500">{item.subLabel}</span>
                </div>
              ) : (
                label
              );
            return (
              <Combobox.Option as={React.Fragment} key={index} value={item}>
                {({ active, selected }): JSX.Element => (
                  <li className={optionClassName(active, selected)}>
                    {typeof item.icon === 'string' ? (
                      <div className="flex items-center">
                        {item.icon}
                        {fullLabel}
                      </div>
                    ) : (
                      fullLabel
                    )}
                  </li>
                )}
              </Combobox.Option>
            );
          })}
          {showAdd && (
            <Combobox.Option as={React.Fragment} value={pendingValue}>
              {({ active, selected }): JSX.Element => (
                <li className={optionClassName(active, selected)}>
                  <div className="flex items-center">
                    <span className={className.dataEntryAdd}>{icons.plus}</span>
                    {commonText.add()}
                  </div>
                </li>
              )}
            </Combobox.Option>
          )}
          {!listHasItems && (
            <div className={`${optionClassName} cursor-auto`}>
              {formsText.nothingFound()}
            </div>
          )}
        </Combobox.Options>
      </Portal>
    </Combobox>
  );
}

const toggleButton = (
  <Combobox.Button className="absolute inset-y-0 right-0">
    {/* Copied from the @tailwind/forms styles for <select> */}
    <svg
      className="h-[1.5em] w-[1.5em]"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 8l4 4 4-4"
        stroke="#6b7280"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  </Combobox.Button>
);
