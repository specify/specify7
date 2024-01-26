import { Tab } from '@headlessui/react';
import React from 'react';

import type { GetSet, IR } from '../../utils/types';
import { className } from '../Atoms/className';
import { ErrorBoundary } from '../Errors/ErrorBoundary';

export function Tabs({
  tabs,
  index: [currentIndex, handleChange],
}: {
  readonly tabs: IR<JSX.Element>;
  readonly index: GetSet<number>;
}): JSX.Element {
  return (
    <Tab.Group selectedIndex={currentIndex} onChange={handleChange}>
      <Tab.List
        // Don't display tabs if there is only one tab
        className={`flex flex-wrap gap-2 ${
          Object.keys(tabs).length === 1 ? 'sr-only' : ''
        }`}
      >
        {Object.keys(tabs).map((label, index) => (
          <Tab
            className={`${className.niceButton} ${className.infoButton}`}
            key={index}
            /**
             * HeadlessUI does not trigger onChange on click on current tab.
             * This is a workaround. It overrides their click handler only
             * if the option IS current.
             */
            onClick={
              currentIndex === index ? () => handleChange(index) : undefined
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
