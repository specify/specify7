/**
 * Base layout for WbPlanView
 *
 * @module
 */

import React from 'react';

import { ContainerFull } from './basic';
import { useId } from './hooks';

export function Layout(props: {
  readonly children: React.ReactNode;
  readonly readonly: boolean;
  readonly footer?: JSX.Element;
  readonly handleClick?: () => void;

  readonly title: string | JSX.Element;
  readonly buttonsLeft: React.ReactNode;
  readonly buttonsRight: React.ReactNode;
}): JSX.Element {
  const id = useId('wbplanview-header');
  return (
    <ContainerFull
      onClick={
        typeof props.handleClick === 'undefined'
          ? undefined
          : (event): void =>
              (event.target as HTMLElement).closest(
                '.custom-select-closed-list'
              ) === null &&
              (event.target as HTMLElement).closest(
                '.custom-select-mapping-options-list'
              ) === null &&
              props.handleClick
                ? props.handleClick()
                : undefined
      }
    >
      <header className="gap-x-2 whitespace-nowrap flex">
        <h2
          className="gap-x-1 flex items-center overflow-x-auto"
          id={id('name')}
        >
          {props.title}
        </h2>
        <div role="toolbar" className="contents">
          {props.buttonsLeft}
          <span className="flex-1 -ml-2" />
          {props.buttonsRight}
        </div>
      </header>
      <div
        className="gap-y-4 flex flex-col flex-1 overflow-hidden"
        aria-labelledby={id('name')}
      >
        {props.children}
      </div>
      {props.footer}
    </ContainerFull>
  );
}
