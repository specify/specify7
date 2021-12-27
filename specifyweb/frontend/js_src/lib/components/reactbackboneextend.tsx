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
import ErrorBoundary from './errorboundary';
import type { IR } from '../types';

type ReactBackboneExtendBaseProps<CONSTRUCTOR_PROPS> = {
  readonly el: HTMLElement;
  readonly remove: () => void;
  readonly options: CONSTRUCTOR_PROPS;
};

export type Constructable<TYPE, PROPS extends IR<unknown> = IR<never>> = new (
  props: PROPS
) => TYPE;

const createBackboneView = <
  COMPONENT_PROPS extends IR<unknown>,
  CONSTRUCTOR_PROPS extends IR<unknown> = COMPONENT_PROPS
>({
  moduleName,
  title,
  className,
  tagName,
  remove,
  silentErrors = false,
  component: Component,
  getComponentProps,
}: {
  readonly moduleName: string;
  readonly title?:
    | string
    | ((self: ReactBackboneExtendBaseProps<CONSTRUCTOR_PROPS>) => string);
  readonly className?: string;
  readonly tagName?: string;
  readonly remove?: (
    self: ReactBackboneExtendBaseProps<CONSTRUCTOR_PROPS>
  ) => void;
  readonly silentErrors?: boolean;
  readonly component: (props: COMPONENT_PROPS) => JSX.Element | null;
  readonly getComponentProps?: (
    self: ReactBackboneExtendBaseProps<CONSTRUCTOR_PROPS>
  ) => COMPONENT_PROPS;
}): Constructable<View, CONSTRUCTOR_PROPS> =>
  Backbone.View.extend({
    __name__: moduleName,
    className,
    tagName,
    title,
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
      remove?.(this);
      ReactDOM.unmountComponentAtNode(this.el);
      Backbone.View.prototype.remove.call(this);
    },
  });

export default createBackboneView;
