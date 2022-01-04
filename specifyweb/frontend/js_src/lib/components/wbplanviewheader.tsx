/**
 * Base layout for WbPlanView
 *
 * @module
 */

import React from 'react';

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
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
    <div
      className={`wbplanview content-no-shadow ${
        props.readonly ? 'wbplanview-readonly' : ''
      }`}
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
      <header className="wbplanview-header">
        <h2 className="wbplanview-ds-name v-center" id={id('name')}>
          {props.title}
        </h2>
        <div role="toolbar" className="contents">
          {props.buttonsLeft}
          <span className="spacer" />
          {props.buttonsRight}
        </div>
      </header>
      <div
        className="wbplanview-container wbplanview-mapping-container"
        aria-labelledby={id('name')}
      >
        {props.children}
      </div>
      {props.footer}
    </div>
  );
}
