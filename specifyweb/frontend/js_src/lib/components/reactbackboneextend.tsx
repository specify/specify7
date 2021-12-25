/*
 *
 * Type-safe React wrapper for Backbone.View.extend
 * It's like a gate between Backbone Views and React components
 *
 *
 */

import type { View } from 'backbone';
import React from 'react';
import ReactDOM from 'react-dom';

import Backbone from '../backbone';
import ErrorBoundary from './errorboundary';
import type { IR } from './wbplanview';

type ReactBackboneExtendBaseProps<BACKBONE_PROPS> = {
  readonly el: HTMLElement;
  readonly remove: () => void;
} & BACKBONE_PROPS;

export type Constructable<TYPE, PROPS extends IR<unknown> = IR<never>> = new (
  props: PROPS
) => TYPE;

const createBackboneView = <
  CONSTRUCTOR_PROPS extends IR<unknown>,
  BACKBONE_PROPS extends IR<unknown>,
  COMPONENT_PROPS extends IR<unknown>
>({
  moduleName,
  title,
  className,
  tagName,
  initialize,
  beforeRender,
  remove,
  silentErrors = false,
  component: Component,
  getComponentProps,
}: {
  readonly moduleName: string;
  readonly title?:
    | string
    | ((self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>) => string);
  readonly className: string;
  readonly tagName?: string;
  readonly initialize?: (
    self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>,
    viewProps: CONSTRUCTOR_PROPS
  ) => void;
  readonly beforeRender?: (
    self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>
  ) => void;
  readonly remove?: (
    self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>
  ) => void;
  readonly silentErrors?: boolean;
  readonly component: (props: COMPONENT_PROPS) => JSX.Element | null;
  readonly getComponentProps: (
    self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>
  ) => COMPONENT_PROPS;
}): Constructable<View, CONSTRUCTOR_PROPS> =>
  Backbone.View.extend({
    __name__: moduleName,
    className,
    tagName,
    title,
    initialize(props: CONSTRUCTOR_PROPS) {
      initialize?.(this, props);
    },
    render() {
      beforeRender?.(this);

      ReactDOM.render(
        <React.StrictMode>
          <ErrorBoundary silentErrors={silentErrors}>
            <Component {...getComponentProps(this)} />
          </ErrorBoundary>
        </React.StrictMode>,
        this.el
      );
      return this;
    },
    remove() {
      remove?.(this);
      ReactDOM.unmountComponentAtNode(this.el);
      Backbone.View.prototype.remove.call(this);
    },
  });

export default createBackboneView;
