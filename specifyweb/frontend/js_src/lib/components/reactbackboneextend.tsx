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
import { ErrorBoundary } from './errorboundary';

const createBackboneView = <PROPS extends IR<unknown>>(
  Component: (props: PROPS) => JSX.Element | null
): new (props: PROPS & { readonly el?: HTMLElement }) => View =>
  Backbone.View.extend({
    __name__: Component.name,
    render() {
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
    },
    remove() {
      ReactDOM.unmountComponentAtNode(this.el);
      Backbone.View.prototype.remove.call(this);
    },
  });

export default createBackboneView;
