import React from 'react';
import _ from 'underscore';

import { listen, registerBlurEmitter } from '../events';
import { f } from '../functools';
import { commonText } from '../localization/common';
import type { RA } from '../types';
import { ensure } from '../types';
import type { TagProps } from './basic';
import { className, DialogContext } from './basic';
import { Portal } from './common';
import { useBooleanState, useId, useTriggerState } from './hooks';
import { icons } from './icons';
import { compareStrings } from './internationalization';
import { usePref } from './preferenceshooks';

const debounceRate = 300;

type Item<T> = {
  readonly label: string | JSX.Element;
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

const itemProps = ensure<Partial<TagProps<'li'>>>()({
  className: `p-0.5 hover:text-brand-300 hover:bg-gray-100
      dark:hover:bg-neutral-800 active:bg-brand-100 dark:active:bg-brand-500
      disabled:cursor-default rounded`,
  role: 'options',
  tabIndex: -1,
} as const);

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
export function Autocomplete<T>({
  source,
  minLength = 1,
  delay = debounceRate,
  forwardRef,
  filterItems: shouldFilterItems,
  onChange: handleChange,
  onNewValue: handleNewValue,
  onCleared: handleCleared,
  children,
  'aria-label': ariaLabel,
  value: currentValue,
  pendingValueRef,
}: {
  readonly source: RA<Item<T>> | ((value: string) => Promise<RA<Item<T>>>);
  readonly minLength?: number;
  readonly delay?: number;
  readonly onNewValue?: (value: string) => void;
  readonly onChange: (item: Item<T>) => void;
  readonly onCleared?: () => void;
  readonly forwardRef?:
    | React.MutableRefObject<HTMLInputElement | null>
    | React.RefCallback<HTMLInputElement>;
  readonly filterItems: boolean;
  readonly children: (props: {
    readonly forwardRef: React.RefCallback<HTMLInputElement>;
    readonly value: string;
    readonly type: 'search';
    readonly autoComplete: 'off';
    readonly 'aria-expanded': boolean;
    readonly 'aria-autocomplete': 'list';
    readonly 'aria-controls': string;
    readonly 'aria-label': string | undefined;
    readonly className: 'autocomplete' | '';
    readonly onClick: () => void;
    readonly onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    readonly onValueChange: (value: string) => void;
    readonly onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  }) => JSX.Element;
  readonly 'aria-label': string | undefined;
  readonly value: string;
  /*
   * For low-level access to the value in the input box before user finished
   * typing
   */
  readonly pendingValueRef?: React.MutableRefObject<string>;
}): JSX.Element {
  const id = useId('autocomplete-data-list')('');
  const [results, setResults] = React.useState<RA<Item<T>>>([]);

  const [searchAlgorithm] = usePref('form', 'autoComplete', 'searchAlgorithm');

  const filterItems = React.useCallback(
    (newResults: typeof results, pendingValue: string) =>
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

            const isEqual =
              typeof searchValue === 'string' &&
              compareStrings(
                searchValue.slice(0, pendingValue.length),
                pendingValue
              ) === 0;
            return isEqual;
          })
        : newResults,
    [shouldFilterItems, searchAlgorithm]
  );

  /*
   * If currently focused autoComplete item is removed, focus would be lost.
   * In such cases, need to move the focus to the input element
   */
  const resqueFocus = (): void =>
    f.maybe(document.activeElement?.closest('li') ?? undefined, (li) =>
      typeof li === 'object' && li.closest('ul') === dataListRef.current
        ? inputRef.current?.focus()
        : undefined
    );
  const updateItems = React.useCallback(
    (items: RA<Item<T>>, pendingValue: string): void => {
      // Focus might have moved since began fetching, thus need to rescue again
      resqueFocus();
      setResults(items);
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

      previousValue.current = value;

      if (value.length < minLength) return;

      resqueFocus();
      handleLoading();
      void fetchItems(value)
        .then((items) => updateItems(items, value))
        .catch(console.error)
        .finally(handleLoaded);
    },
    delay),
    []
  );

  const [isOpen, handleOpen, handleClose, handleToggle] = useBooleanState();

  const [input, setInput] = React.useState<HTMLInputElement | null>(null);
  const dataListRef = React.useRef<HTMLUListElement | null>(null);

  const [filteredItems, setFilteredItems] = React.useState<RA<Item<T>>>([]);

  const [currentIndex, setCurrentIndex] = React.useState<number>(-1);
  const [pendingValue, setPendingValue] = useTriggerState<string>(currentValue);
  React.useEffect(() => {
    if (typeof pendingValueRef === 'object')
      pendingValueRef.current ??= currentValue;
  }, [currentValue, pendingValueRef]);
  React.useEffect(
    () => setFilteredItems(filterItems(results, pendingValue)),
    [pendingValue, filterItems, results]
  );

  /*
   * If a value is already selected and you open a list again, show all results,
   * not just the filtered results. This is because most of the time there is
   * only one element that starts with the current value (the current element),
   * thus the filtered list of items has only one item.
   */
  const ignoreFilter = currentValue === pendingValue;
  const itemSource = ignoreFilter ? results : filteredItems;

  const showAdd =
    !isLoading &&
    typeof handleNewValue === 'function' &&
    pendingValue !== currentValue;
  const listHasItems = showAdd || isLoading || itemSource.length > 0;
  const showList = isOpen && listHasItems;

  function handleAddNew(): void {
    handleBlur();
    handleClose();
    handleNewValue?.(pendingValue);
    input?.focus();
  }

  function handleChanged(item: Item<T>): void {
    handleChange(item);
    const value =
      typeof item.label === 'string' ? item.label : item.searchValue ?? '';
    setPendingValue(value);
    if (typeof pendingValueRef === 'object') pendingValueRef.current = value;
    handleClose();
    input?.focus();
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement | HTMLUListElement>
  ): void {
    let newIndex = currentIndex;
    if (event.key === 'Escape' || event.key === 'Enter') {
      event.preventDefault();
      const newItem = itemSource[currentIndex];
      if (typeof newItem === 'object') handleChanged(newItem);
      else if (currentIndex === itemSource.length && showAdd) handleAddNew();
    } else if (event.key === 'ArrowUp')
      newIndex = Math.max(currentIndex - 1, -1);
    else if (event.key === 'ArrowDown') newIndex = currentIndex + 1;

    if (newIndex !== currentIndex) {
      event.preventDefault();
      const itemCount = itemSource.length + (showAdd ? 1 : 0);
      const finalIndex = (itemCount + newIndex) % Math.max(itemCount, 1);
      setCurrentIndex(finalIndex);
      const item = dataListRef.current?.children?.[finalIndex];
      (item as HTMLElement)?.focus();
    }
  }

  const isInDialog = typeof React.useContext(DialogContext) === 'function';

  const [autoGrowAutoComplete] = usePref(
    'form',
    'autoComplete',
    'autoGrowAutoComplete'
  );
  /*
   * Reposition the autocomplete box as needed
   * Not handling resize events as onBlur would close the list box on resize
   */
  React.useEffect(() => {
    if (dataListRef.current === null || input === null) return undefined;

    /*
     * Assuming height does not change while the list is open for performance
     * reasons
     */
    const listHeight = dataListRef.current.getBoundingClientRect().height;

    const scrollableParent = getScrollParent(input);
    const { top: parentTop, bottom: parentBottom } =
      scrollableParent.getBoundingClientRect();

    const {
      left: inputLeft,
      width: inputWidth,
      x: inputStart,
    } = input.getBoundingClientRect();
    dataListRef.current.style.left = `${inputLeft}px`;
    if (autoGrowAutoComplete) {
      dataListRef.current.style.maxWidth = `${
        (document.body.clientWidth - inputStart) * 0.9
      }px`;
      dataListRef.current.style.minWidth = `${inputWidth}px`;
    } else dataListRef.current.style.width = `max(${inputWidth}px, 6rem)`;

    function handleScroll({
      target,
    }: {
      readonly target: EventTarget | null;
    }): void {
      if (
        dataListRef.current === null ||
        input === null ||
        // If it is the list itself that is being scrolled
        target === dataListRef.current
      )
        return;
      if (!showList) {
        dataListRef.current.classList.add('sr-only');
        return;
      }

      const { bottom: inputBottom, top: inputTop } =
        input.getBoundingClientRect();

      /*
       * Hide the list for non screen reader users when it goes below the
       * container so as not to cause content overflow
       */
      const shouldHide = inputTop > parentBottom || inputBottom < parentTop;
      if (shouldHide) dataListRef.current.classList.add('sr-only');
      else {
        dataListRef.current.classList.remove('sr-only');
        const isOverflowing = inputBottom + listHeight > parentBottom;
        if (isOverflowing) {
          dataListRef.current.style.top = '';
          dataListRef.current.style.bottom = `${
            document.body.clientHeight - inputTop
          }px`;
        } else {
          dataListRef.current.style.top = `${inputBottom}px`;
          dataListRef.current.style.bottom = '';
        }
      }
    }

    handleScroll({ target: null });

    return listen(window, 'scroll', handleScroll, true);
  }, [showList, input, isInDialog, autoGrowAutoComplete]);

  const [highlightMatch] = usePref('form', 'autoComplete', 'highlightMatch');
  const [closeOnOutsideClick] = usePref(
    'form',
    'autoComplete',
    'closeOnOutsideClick'
  );

  const emitBlur = React.useRef<() => void>(console.error);

  function handleBlur(): void {
    emitBlur.current();
    if (closeOnOutsideClick) handleClose();
  }

  React.useEffect(
    () =>
      input === null
        ? undefined
        : registerBlurEmitter(input, (emit) => {
            emitBlur.current = emit;
            return f.void;
          }),
    [input]
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

  return (
    <>
      {children({
        forwardRef: forwardChildRef,
        value: pendingValue,
        type: 'search',
        autoComplete: 'off',
        'aria-expanded': showList,
        'aria-autocomplete': 'list',
        'aria-controls': id,
        'aria-label': ariaLabel,
        className: listHasItems ? 'autocomplete' : '',
        onKeyDown: (event) => (showList ? handleKeyDown(event) : handleOpen()),
        onValueChange(value) {
          if (value === '') handleCleared?.();
          handleRefreshItems(source, value);
          setPendingValue(value);
          if (typeof pendingValueRef === 'object')
            pendingValueRef.current = value;
        },
        onClick: handleToggle,
        onBlur({ relatedTarget }): void {
          if (
            relatedTarget === null ||
            dataListRef.current?.contains(relatedTarget as Node) === false
          ) {
            handleBlur();
            if (closeOnOutsideClick) setPendingValue(currentValue);
          }
        },
      })}
      {/* Portal is needed so that the list can flow outside the bounds
       * of parents with overflow:hidden */}
      <Portal>
        <ul
          className={`fixed w-[inherit] rounded cursor-pointer z-[10000]
            rounded bg-white dark:bg-neutral-900 max-h-[50vh] overflow-y-auto
            shadow-lg shadow-gray-400 dark:border dark:border-gray-500
            ${showList ? '' : 'sr-only'}`}
          role="listbox"
          aria-label={ariaLabel}
          id={id}
          ref={dataListRef}
          onKeyDown={(event): void => {
            // Meta keys
            if (
              ['Space', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key)
            ) {
              handleKeyDown(event);
            } else input?.focus();
          }}
          onBlur={({ relatedTarget, target, currentTarget }): void =>
            relatedTarget === null ||
            (input?.contains(relatedTarget as Node) === false &&
              target.closest('ul') !== currentTarget)
              ? handleBlur()
              : undefined
          }
        >
          {showList && (
            <>
              {isLoading && (
                <li
                  aria-selected={false}
                  aria-disabled={true}
                  {...itemProps}
                  className={`${itemProps.className} cursor-auto`}
                >
                  {commonText('loading')}
                </li>
              )}
              {itemSource.map((item, index, { length }) => {
                /**
                 * Highlight relevant part of the string.
                 * Note, if item.searchValue and item.value is different,
                 * label might not be highlighted even if it matched
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
                            startIndex +
                            (index === 0 ? 0 : pendingValue.length);
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
                  <li
                    key={index}
                    aria-posinset={index + 1}
                    aria-setsize={length + Number(showAdd)}
                    aria-selected={index === currentIndex}
                    onClick={handleChanged.bind(undefined, item)}
                    {...itemProps}
                  >
                    {typeof item.icon === 'string' ? (
                      <div className="flex items-center">
                        {item.icon}
                        {fullLabel}
                      </div>
                    ) : (
                      fullLabel
                    )}
                  </li>
                );
              })}
              {showAdd && (
                <li
                  aria-selected={itemSource.length === currentIndex}
                  aria-posinset={itemSource.length}
                  aria-setsize={itemSource.length + 1}
                  onClick={handleAddNew}
                  {...itemProps}
                >
                  <div className="flex items-center">
                    <span className={className.dataEntryAdd}>{icons.plus}</span>
                    {commonText('add')}
                  </div>
                </li>
              )}
            </>
          )}
        </ul>
      </Portal>
    </>
  );
}
