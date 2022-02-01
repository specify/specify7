/**
 * Type-safe React wrapper for Backbone.View
 * It's like a gate between Backbone Views and React components
 *
 * @module
 */

import { default as Backbone, type View } from 'backbone';
import React from 'react';
import ReactDOM from 'react-dom';

import type { IR } from '../types';
import { ErrorBoundary } from './errorboundary';

const createBackboneView = <PROPS extends IR<unknown>>(
  Component: (props: PROPS) => JSX.Element | null
): new (props?: PROPS & { readonly el?: HTMLElement }) => View =>
  ({
    [Component.name]: class extends Backbone.View {
      private readonly options: PROPS & { readonly el?: HTMLElement };

      public constructor(options?: PROPS & { readonly el?: HTMLElement }) {
        super();
        this.options = (options ?? {}) as PROPS;
      }

      public render(): this {
        this.el.classList.add('contents');
        ReactDOM.render(
          <React.StrictMode>
            <ErrorBoundary>
              <Component {...this.options} />
            </ErrorBoundary>
          </React.StrictMode>,
          this.el
        );
        return this;
      }

      public remove(): this {
        ReactDOM.unmountComponentAtNode(this.el);
        Backbone.View.prototype.remove.call(this);
        return this;
      }
    },
  }[Component.name]);

export default createBackboneView;
