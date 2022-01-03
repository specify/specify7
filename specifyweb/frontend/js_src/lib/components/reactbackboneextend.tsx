/**
 * Type-safe React wrapper for Backbone.View.extend
 * It's like a gate between Backbone Views and React components
 *
 * @module
 */

import type { View } from 'backbone';
import React from 'react';
import ReactDOM from 'react-dom';

import Backbone from '../backbone';
import type { IR } from '../types';
import ErrorBoundary from './errorboundary';

type ReactBackboneExtendBaseProps<CONSTRUCTOR_PROPS> = {
  readonly el: Readonly<HTMLElement>;
  readonly remove: () => void;
  readonly options: CONSTRUCTOR_PROPS;
};

const createBackboneView = <
  COMPONENT_PROPS extends IR<unknown>,
  CONSTRUCTOR_PROPS extends IR<unknown> = COMPONENT_PROPS
>(
  Component: (props: COMPONENT_PROPS) => JSX.Element | null,
  {
    className,
    tagName = 'div',
    silentErrors = false,
    getComponentProps,
  }: {
    readonly className?: string;
    readonly tagName?: string;
    readonly silentErrors?: boolean;
    readonly getComponentProps?: (
      self: ReactBackboneExtendBaseProps<CONSTRUCTOR_PROPS>
    ) => COMPONENT_PROPS;
  } = {}
): new (props: CONSTRUCTOR_PROPS & { readonly el?: HTMLElement }) => View =>
  Backbone.View.extend({
    __name__: Component.name,
    className,
    tagName,
    render() {
      ReactDOM.render(
        <React.StrictMode>
          <ErrorBoundary silentErrors={silentErrors}>
            <Component {...(getComponentProps?.(this) ?? this.options)} />
          </ErrorBoundary>
        </React.StrictMode>,
        this.el
      );
      return this;
    },
    remove() {
      ReactDOM.unmountComponentAtNode(this.el);
      Backbone.View.prototype.remove.call(this);
    },
  });

export default createBackboneView;
