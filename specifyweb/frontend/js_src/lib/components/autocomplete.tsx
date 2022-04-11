import React from 'react';
import _ from 'underscore';

import { f } from '../functools';
import commonText from '../localization/common';
import type { RA } from '../types';
import { ensure } from '../types';
import type { TagProps } from './basic';
import { className, DialogContext } from './basic';
import { Portal } from './common';
import { useBooleanState, useId, useTriggerState } from './hooks';
import { icons } from './icons';
import { compareStrings } from './internationalization';

const debounceRate = 300;

type Item<T> = {
  readonly label: string;
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

/**
 * An accessible autocomplete.
 *
 * @remarks
 * Previous implementation (see Git history) used <datalist> to provide
 * autocomplete suggestions.
 * While that had accessibility backed in, Firefox has a number of bugs
 * with it's datalist implementation.
 * Plus, that solution did not allow for displaying an "Add" option
 * if no search results come up
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
  onChange: handleChange,
  onNewValue: handleNewValue,
  onCleared: handleCleared,
  children,
  'aria-label': ariaLabel,
  value: currentValue,
}: {
  readonly source: RA<Item<T>> | ((value: string) => Promise<RA<Item<T>>>);
  readonly minLength?: number;
  readonly delay?: number;
  readonly onNewValue?: (value: string) => void;
  readonly onChange: (item: Item<T>) => void;
  readonly onCleared?: () => void;
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
    readonly onValueChange: (value: string) => void;
    readonly onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  }) => JSX.Element;
  readonly 'aria-label': string | undefined;
  readonly value: string;
}): JSX.Element {
  const id = useId('autocomplete-data-list')('');
  const [results, setResults] = React.useState<RA<Item<T>>>([]);

  const filterItems = React.useCallback(
    (newResults: typeof results, pendingValue: string) =>
      pendingValue.length === 0
        ? newResults
        : newResults.filter(
            ({ label, searchValue }) =>
              label.includes(pendingValue) ||
              (typeof searchValue === 'string' &&
                compareStrings(
                  label.slice(0, pendingValue.length),
                  pendingValue
                ) === 0)
          ),
    []
  );
  const findItem = (filteredItems: RA<Item<T>>, pendingValue: string) =>
    filteredItems.find(
      ({ label }) => compareStrings(label, pendingValue) === 0
    );

  const updateItems = React.useCallback(
    (items: RA<Item<T>>, pendingValue: string): void =>
      setResults((oldItems) => {
        // Don't delete previous autocomplete results if no new results returned
        const newResults =
          oldItems.length > 0 && items.length === 0 ? oldItems : items;
        setFilteredItems(filterItems(newResults, pendingValue));
        return newResults;
      }),
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

      handleLoading();
      previousValue.current = value;

      if (value.length < minLength) return;

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

  const [currentIndex, setCurrentIndex] = React.useState<number>(-1);
  const [pendingValue, setPendingValue] = useTriggerState<string>(currentValue);
  const [filteredItems, setFilteredItems] = React.useState<RA<Item<T>>>([]);

  function handleKeyDown(key: string): void {
    let newIndex = currentIndex;
    if (key === 'Escape' || key === 'Enter') {
      const newItem = filteredItems[currentIndex];
      if (typeof newItem === 'object') handleChange(newItem);
      handleClose();
      input?.focus();
    } else if (key === 'ArrowUp') newIndex = Math.max(currentIndex - 1, -1);
    else if (key === 'ArrowDown') newIndex = currentIndex + 1;

    if (newIndex !== currentIndex) {
      const finalIndex =
        (filteredItems.length + newIndex) % filteredItems.length;
      setCurrentIndex(finalIndex);
      (dataListRef.current?.children?.[finalIndex] as HTMLElement)?.focus();
    }
  }

  const itemProps = ensure<Partial<TagProps<'li'>>>()({
    className: `p-0.5 hover:text-brand-300 hover:bg-gray-100
      dark:hover:bg-neutral-800 active:bg-brand-100 dark:active:bg-brand-500
      disabled:cursor-default rounded`,
    role: 'options',
    tabIndex: -1,
  } as const);

  const showAdd =
    filteredItems.length === 0 &&
    !isLoading &&
    typeof handleNewValue === 'function' &&
    pendingValue.length > 0 &&
    pendingValue !== currentValue;
  const showList = isOpen && (showAdd || isLoading || filteredItems.length > 0);

  const isInDialog = typeof React.useContext(DialogContext) === 'function';

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

    const { left: inputLeft, width: inputWidth } =
      input.getBoundingClientRect();
    dataListRef.current.style.left = `${inputLeft}px`;
    dataListRef.current.style.width = `${inputWidth}px`;

    function handleScroll({
      target,
    }: {
      readonly target: EventTarget | null;
    }): void {
      if (
        !showList ||
        dataListRef.current === null ||
        input === null ||
        // If it is the list itself that is being scrolled
        target === dataListRef.current
      )
        return;

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
        dataListRef.current.style.top = `${
          isOverflowing ? inputTop - listHeight : inputBottom
        }px`;
      }
    }

    handleScroll({ target: null });

    window.addEventListener('scroll', handleScroll, true);
    return (): void => window.removeEventListener('scroll', handleScroll, true);
  }, [showList, input, isInDialog]);

  return (
    <>
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
        'aria-expanded': showList,
        'aria-autocomplete': 'list',
        'aria-controls': id,
        'aria-label': ariaLabel,
        onKeyDown: (event) =>
          showList ? handleKeyDown(event.key) : handleOpen(),
        onValueChange(value) {
          if (value === '' && pendingValue.length > 1) handleCleared?.();
          handleRefreshItems(source, value);
          const filteredItems = filterItems(results, value);
          setFilteredItems(filteredItems);
          const item = findItem(filteredItems, value);
          if (typeof item === 'object') handleChange(item);
          else setPendingValue(value);
        },
        onClick: handleToggle,
        onBlur({ relatedTarget }): void {
          if (
            process.env.NODE_ENV !== 'development' &&
            (relatedTarget === null ||
              dataListRef.current?.contains(relatedTarget as Node) === false)
          ) {
            handleClose();
            setPendingValue(currentValue);
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
            if (['Space', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key))
              handleKeyDown(event.key);
            else {
              input?.focus();
              input?.dispatchEvent(event.nativeEvent);
            }
          }}
          onBlur={({ relatedTarget }): void =>
            process.env.NODE_ENV !== 'development' &&
            (relatedTarget === null ||
              input?.contains(relatedTarget as Node) === false)
              ? handleClose()
              : undefined
          }
        >
          {showList && (
            <>
              {isLoading && (
                <li aria-selected={false} aria-disabled={true} {...itemProps}>
                  {commonText('loading')}
                </li>
              )}
              {showAdd ? (
                <li
                  aria-selected={false}
                  aria-posinset={1}
                  aria-setsize={1}
                  onClick={(): void => handleNewValue(pendingValue)}
                >
                  <div className="flex items-center">
                    <span className={className.dataEntryAdd}>{icons.plus}</span>
                    {commonText('add')}
                  </div>
                </li>
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
                    {f.var(
                      typeof item.subLabel === 'string' ? (
                        <div className="flex flex-col justify-center">
                          {item.label}
                          <span className="text-gray-500">{item.subLabel}</span>
                        </div>
                      ) : (
                        item.label
                      ),
                      (content) =>
                        typeof item.icon === 'string' ? (
                          <div className="flex items-center">
                            {item.icon}
                            {content}
                          </div>
                        ) : (
                          content
                        )
                    )}
                  </li>
                ))
              )}
            </>
          )}
        </ul>
      </Portal>
    </>
  );
}
