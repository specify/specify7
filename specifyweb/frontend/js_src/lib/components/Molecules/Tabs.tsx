import { Tab } from '@headlessui/react';
import React from 'react';

import type { GetSet, IR } from '../../utils/types';
import { radioButtonClassName } from '../AppResources/Filters';
import { ErrorBoundary } from '../Errors/ErrorBoundary';

export function Tabs({
  tabs,
  index: [currentIndex, handleChange],
  variant = 'separated',
}: {
  readonly tabs: IR<JSX.Element>;
  readonly index: GetSet<number>;
  readonly variant?: 'combined' | 'separated';
}): JSX.Element {
  return (
    <Tab.Group selectedIndex={currentIndex} onChange={handleChange}>
      <Tab.List
        className={`
          inline-flex w-fit flex-wrap gap-2 rounded
          ${variant === 'separated' ? '' : 'bg-[color:var(--form-background)]'}
          ${
            // Don't display tabs if there is only one tab
            Object.keys(tabs).length === 1 ? 'sr-only' : ''
          }
        `}
      >
        {Object.keys(tabs).map((label, index) => (
          <Tab
            className={radioButtonClassName(currentIndex === index)}
            key={index}
            /**
             * HeadlessUI does not trigger onChange on click on current tab.
             * This is a workaround. It overrides their click handler only
             * if the option IS current.
             */
            onClick={
              currentIndex === index
                ? (): void => handleChange(index)
                : undefined
            }
          >
            {label}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="flex flex-1 overflow-hidden">
        {Object.values(tabs).map((element, index) => (
          <Tab.Panel className="flex flex-1 flex-col gap-4" key={index}>
            <ErrorBoundary dismissible>{element}</ErrorBoundary>
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}
