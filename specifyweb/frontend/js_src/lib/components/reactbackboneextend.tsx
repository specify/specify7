/*
 *
 * Type-safe React wrapper for Backbone.View.extend
 * It's like a gate between Backbone Views and React components
 *
 *
 */

import React from 'react';
import ReactDOM from 'react-dom';

import Backbone from '../backbone';
import { setTitle } from '../specifyapp';
import ErrorBoundary from './errorboundary';
import type { IR } from './wbplanview';

type ReactBackboneExtendBaseProps<BACKBONE_PROPS> = {
  el: HTMLElement;
  remove: () => void;
} & BACKBONE_PROPS;

export default <CONSTRUCTOR_PROPS, BACKBONE_PROPS, COMPONENT_PROPS>({
  moduleName,
  title,
  className,
  initialize,
  renderPre,
  renderPost,
  remove,
  silentErrors = false,
  Component,
  getComponentProps,
}: {
  readonly moduleName: string;
  readonly title?:
    | string
    | ((self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>) => string);
  readonly className: string;
  readonly initialize: (
    self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>,
    viewProps: CONSTRUCTOR_PROPS
  ) => void;
  readonly renderPre?: (
    self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>
  ) => void;
  readonly renderPost?: (
    self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>
  ) => void;
  readonly remove?: (
    self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>
  ) => void;
  readonly silentErrors?: boolean;
  readonly Component: (props: COMPONENT_PROPS) => JSX.Element | null;
  readonly getComponentProps: (
    self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>
  ) => COMPONENT_PROPS;
}): IR<unknown> =>
  Backbone.View.extend({
    __name__: moduleName,
    className,
    initialize(props: CONSTRUCTOR_PROPS) {
      initialize(this, props);
    },
    render() {
      renderPre?.(this);

      if (typeof title === 'string') setTitle(title);
      else if (typeof title === 'function') setTitle(title(this));

      ReactDOM.render(
        <React.StrictMode>
          <ErrorBoundary silentErrors={silentErrors}>
            <Component {...getComponentProps(this)} />
          </ErrorBoundary>
        </React.StrictMode>,
        this.el
      );
      renderPost?.(this);
      return this;
    },
    remove() {
      remove?.(this);
      ReactDOM.unmountComponentAtNode(this.el);
      Backbone.View.prototype.remove.call(this);
    },
  });
