/**
 * Base layout for WbPlanView
 *
 * @module
 */

import React from 'react';

import { useId } from '../../hooks/useId';
import { Container } from '../Atoms';

export function Layout(props: {
  readonly children: React.ReactNode;
  readonly footer?: JSX.Element;
  readonly onClick?: () => void;
  readonly title: JSX.Element | string;
  readonly buttonsLeft: React.ReactNode;
  readonly buttonsRight: React.ReactNode;
}): JSX.Element {
  const id = useId('wbplanview-header');
  return (
    <Container.Full
      onClick={
        typeof props.onClick === 'function'
          ? (event): void =>
              (event.target as HTMLElement).closest(
                '.custom-select-closed-list'
              ) === null &&
              (event.target as HTMLElement).closest(
                '.custom-select-options-list'
              ) === null
                ? props.onClick?.()
                : undefined
          : undefined
      }
    >
      <header className="flex gap-2 whitespace-nowrap">
        <h2 className="flex items-center gap-1 overflow-x-auto" id={id('name')}>
          {props.title}
        </h2>
        <div className="contents" role="toolbar">
          {props.buttonsLeft}
          <span className="-ml-2 flex-1" />
          {props.buttonsRight}
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        {props.children}
      </div>
      {props.footer}
    </Container.Full>
  );
}
