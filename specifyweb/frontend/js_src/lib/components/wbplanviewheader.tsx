import React from 'react';
import { R } from './wbplanview';
import { WBPlanViewStates } from './wbplanviewstatereducer';

export function WBPlanViewHeader({
  stateType,
  title,
  buttonsLeft,
  buttonsRight,
}: {
  stateType: WBPlanViewStates['type'];
  title: string;
  buttonsLeft: React.ReactNode;
  buttonsRight: React.ReactNode;
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

export function HeaderWrapper(props: {
  readonly children: React.ReactNode;
  readonly readonly: boolean;
  readonly header: JSX.Element;
  readonly stateName: WBPlanViewStates['type'];
  readonly handleClick?: () => void;
  readonly extraContainerProps?: R<unknown>;
}): JSX.Element {
  return (
    <div
      className={`wbplanview-event-listener ${
        props.readonly ? 'wbplanview-readonly' : ''
      }`}
      onClick={(event) =>
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
    </div>
  );
}
