import React from 'react';

import type { IR } from './wbplanview';
import type { WbPlanViewStates } from './wbplanviewstate';

export function WbPlanViewHeader({
  stateType,
  title,
  buttonsLeft,
  buttonsRight,
}: {
  readonly stateType: WbPlanViewStates['type'];
  readonly title: string | JSX.Element;
  readonly buttonsLeft: React.ReactNode;
  readonly buttonsRight: React.ReactNode;
}): JSX.Element {
  return (
    <header className={`wbplanview-header wbplanview-header-${stateType}`}>
      <nav className="wbplanview-ds-name-container">
        <span className="wbplanview-ds-name v-center">{title}</span>
        {buttonsLeft}
      </nav>
      <nav className="wbplanview-header-controls">{buttonsRight}</nav>
    </header>
  );
}

export function Layout(props: {
  readonly children: React.ReactNode;
  readonly readonly: boolean;
  readonly header: JSX.Element;
  readonly footer?: JSX.Element;
  readonly stateName: WbPlanViewStates['type'];
  readonly handleClick?: () => void;
  readonly extraContainerProps?: IR<unknown>;
}): JSX.Element {
  return (
    <div
      className={`wbplanview-event-listener ${
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
      {props.header}
      <div
        className={`wbplanview-container wbplanview-container-${props.stateName}`}
        {...props.extraContainerProps}
      >
        {props.children}
      </div>
      {props.footer}
    </div>
  );
}
