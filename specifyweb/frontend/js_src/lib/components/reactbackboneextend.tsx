/*
 *
 * Type-safe React wrapper for Backbone.View.extend
 * It's like a gate between Backbone Views and React components
 *
 *
 */

import { View } from 'backbone';
import React from 'react';
import ReactDOM from 'react-dom';

import Backbone from '../backbone';
import app from '../specifyapp.js';
import ErrorBoundary from './errorboundary';

type ReactBackboneExtendBaseProps<BACKBONE_PROPS> = {
  el: HTMLElement;
  remove: () => void;
} & BACKBONE_PROPS;

interface Constructable<T> {
  new (...args: any): T;
}

export default <CONSTRUCTOR_PROPS, BACKBONE_PROPS, COMPONENT_PROPS>({
  moduleName,
  title,
  className,
  tagName,
  initialize,
  renderPre,
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
  readonly tagName?: string;
  readonly initialize?: (
    self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>,
    viewProps: CONSTRUCTOR_PROPS
  ) => void;
  readonly renderPre?: (
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
}): Constructable<View> =>
  Backbone.View.extend({
    __name__: moduleName,
    className,
    tagName,
    initialize(props: CONSTRUCTOR_PROPS) {
      initialize?.(this, props);
    },
    render() {
      renderPre?.(this);

      if (typeof title === 'string') app.setTitle(title);
      else if (typeof title === 'function') app.setTitle(title(this));

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
