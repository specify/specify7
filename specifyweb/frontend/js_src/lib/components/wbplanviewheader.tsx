import React from 'react';

import { useId } from './common';
import type { IR } from '../types';
import type { WbPlanViewStates } from './wbplanviewstate';

export function Layout(props: {
  readonly children: React.ReactNode;
  readonly readonly: boolean;
  readonly footer?: JSX.Element;
  readonly stateName: WbPlanViewStates['type'];
  readonly handleClick?: () => void;

  readonly stateType: WbPlanViewStates['type'];
  readonly title: string | JSX.Element;
  readonly buttonsLeft: React.ReactNode;
  readonly buttonsRight: React.ReactNode;
}): JSX.Element {
  const id = useId('wbplanview-header');
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
      <header
        className={`wbplanview-header wbplanview-header-${props.stateType}`}
      >
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
        className={`wbplanview-container wbplanview-container-${props.stateName}`}
        aria-labelledby={id('name')}
      >
        {props.children}
      </div>
      {props.footer}
    </div>
  );
}
