/*
*
* Type-safe React wrapper for Backbone.View.extend
* It's like a gate between Backbone Views and React components
*
* */

'use strict';

import Backbone      from '../backbone';
import React         from 'react';
import ReactDOM      from 'react-dom';
import ErrorBoundary from './errorboundary';
import app           from '../specifyapp.js';

type ReactBackboneExtendBaseProps<BACKBONE_PROPS> = {
  el: HTMLElement,
  remove: () => void,
} & BACKBONE_PROPS

export default <CONSTRUCTOR_PROPS, BACKBONE_PROPS, COMPONENT_PROPS>({
  moduleName,
  title,
  className,
  initialize,
  renderPre,
  renderPost,
  remove,
  Component,
  getComponentProps,
}: {
  moduleName: string,
  title: string | (
    (self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>) => string
    ),
  className: string,
  initialize: (
    self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>,
    viewProps: CONSTRUCTOR_PROPS,
  ) => void,
  renderPre?: (
    self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>) => void,
  renderPost?: (self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>) => void,
  remove?: (self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>) => void,
  Component: (props: COMPONENT_PROPS) => (JSX.Element | null),
  getComponentProps: (
    self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>,
  ) => COMPONENT_PROPS
}): Record<string, unknown> =>
  Backbone.View.extend({
    __name__: moduleName,
    className,
    initialize(props: CONSTRUCTOR_PROPS) {
      initialize(this, props);
    },
    render() {
      renderPre && renderPre(this);

      if (typeof title === 'string')
        app.setTitle(title);
      else if (typeof title === 'function')
        app.setTitle(title(this));

      ReactDOM.render(<React.StrictMode>
        <ErrorBoundary>
          <Component
            {...getComponentProps(this)}
          />
        </ErrorBoundary>
      </React.StrictMode>, this.el);
      renderPost && renderPost(this);
      return this;
    },
    remove() {
      remove && remove(this);
      ReactDOM.unmountComponentAtNode(this.el);
      Backbone.View.prototype.remove.call(this);
    },
  });