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
  module_name,
  title,
  class_name,
  initialize,
  render_pre,
  render_post,
  remove,
  Component,
  get_component_props,
}: {
  module_name: string,
  title: string | (
    (self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>) => string
    ),
  class_name: string,
  initialize: (
    self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>,
    view_props: CONSTRUCTOR_PROPS,
  ) => void,
  render_pre?: (self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>) => void,
  render_post?: (self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>) => void,
  remove?: (self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>) => void,
  Component: (props: COMPONENT_PROPS) => (JSX.Element | null),
  get_component_props: (
    self: ReactBackboneExtendBaseProps<BACKBONE_PROPS>,
  ) => COMPONENT_PROPS
}): Record<string, unknown> =>
  Backbone.View.extend({
    __name__: module_name,
    className: class_name,
    initialize(props: CONSTRUCTOR_PROPS) {
      initialize(this, props);
    },
    render() {
      render_pre && render_pre(this);

      if (typeof title === 'string')
        app.setTitle(title);
      else if (typeof title === 'function')
        app.setTitle(title(this));

      ReactDOM.render(<React.StrictMode>
        <ErrorBoundary>
          <Component
            {...get_component_props(this)}
          />
        </ErrorBoundary>
      </React.StrictMode>, this.el);
      render_post && render_post(this);
      return this;
    },
    remove() {
      remove && remove(this);
      ReactDOM.unmountComponentAtNode(this.el);
      Backbone.View.prototype.remove.call(this);
    },
  });