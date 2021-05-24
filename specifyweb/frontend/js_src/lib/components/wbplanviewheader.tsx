import React from 'react';

import type { IR } from './wbplanview';
import type { WBPlanViewStates } from './wbplanviewstatereducer';

export function WBPlanViewHeader({
  stateType,
  title,
  buttonsLeft,
  buttonsRight,
}: {
  readonly stateType: WBPlanViewStates['type'];
  readonly title: string | JSX.Element;
  readonly buttonsLeft: React.ReactNode;
  readonly buttonsRight: React.ReactNode;
}): JSX.Element {
  return (
    <div className={`wbplanview-header wbplanview-header-${stateType}`}>
      <div>
        <span>{title}</span>
        {buttonsLeft}
      </div>
      <div>{buttonsRight}</div>
    </div>
  );
}

export function Layout(props: {
  readonly children: React.ReactNode;
  readonly readonly: boolean;
  readonly header: JSX.Element;
  readonly footer?: JSX.Element;
  readonly stateName: WBPlanViewStates['type'];
  readonly handleClick?: () => void;
  readonly extraContainerProps?: IR<unknown>;
}): JSX.Element {
  return (
    <div
      className={`wbplanview-event-listener ${
        props.readonly ? 'wbplanview-readonly' : ''
      }`}
      onClick={(event): void =>
        (event.target as HTMLElement).closest('.custom-select-closed-list') ===
          null &&
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
