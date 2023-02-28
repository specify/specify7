/**
 * Primitive React components from which all other components are built
 *
 * These primitive components wrap native DOM elements, while also adding
 * custom styles and in some cases custom logic
 */

import { className } from './className';
import { wrap } from './wrapper';

export const ErrorMessage = wrap(
  'ErrorMessage',
  'div',
  'flex flex-col gap-2 p-2 text-white bg-red-500 rounded',
  {
    role: 'alert',
  }
);

export const Container = {
  /**
   * Full-screen gray container. Ment to be a wrapper for Container.Base
   */
  FullGray: wrap('Container.FullGray', 'div', className.containerFullGray),
  /**
   * Limited width white container. Ment to be wrapped inside Container.FullGray
   * Commonly used as an <aside> to main content
   */
  Base: wrap('Container.Base', 'section', className.containerBase),
  /**
   * Limited width white container. Ment to be wrapped inside Container.FullGray
   */
  Center: wrap('Container.Center', 'section', className.containerCenter),

  /**
   * Full-screen white container. Ment to be a wrapper for full width content
   */
  Full: wrap('Container.Full', 'section', className.containerFull),
};

export const Progress = wrap<'progress', { readonly value: number }>(
  'Progress',
  'progress',
  'w-full h-3 bg-gray-200 dark:bg-neutral-700 rounded',
  {
    max: 100,
  }
);

/*
 * Need to set explicit [role] for list without bullets to be announced as a list
 * REFACTOR: consider adding "flex flex-col gap-1" and .contents to <li>
 */
export const Ul = wrap('Ul', 'ul', '', { role: 'list' });

export const H2 = wrap('H2', 'h2', className.headerPrimary);
export const H3 = wrap('H3', 'h3', className.headerGray);

export const Summary = wrap<
  'summary',
  { readonly onToggle: (isCollapsed: boolean) => void }
>('Summary', 'summary', '', ({ onToggle: handleToggle, ...props }) => ({
  ...props,
  onClick:
    typeof props.onClick === 'function' || typeof handleToggle === 'function'
      ? (event): void => {
          /*
           * This is needed to prevent browser from handling state change
           * See: https://github.com/facebook/react/issues/15486
           */
          event.preventDefault();
          props.onClick?.(event);
          const details = (event.target as Element)?.closest('details');
          if (details === null)
            throw new Error("Can't use <summary> outside of <details>");
          handleToggle?.(!details.hasAttribute('open'));
        }
      : undefined,
}));

export const Key = wrap(
  'Key',
  'kbd',
  'bg-gray-200 border-1 dark:border-none dark:bg-neutral-700 rounded-sm mx-1 p-0.5'
);

export const oneRem = Number.parseFloat(
  getComputedStyle(document.documentElement).fontSize
);
