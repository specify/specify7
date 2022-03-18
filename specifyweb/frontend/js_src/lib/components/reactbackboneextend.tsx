/**
 * Type-safe React wrapper for Backbone.View
 * It's like a gate between Backbone Views and React components
 *
 * @module
 */

import { type View, default as Backbone } from 'backbone';
import React from 'react';
import ReactDOM from 'react-dom';

import { error } from '../assert';
import type { IR } from '../types';
import { ErrorBoundary } from './errorboundary';

/**
 * If ReactDOM.render props changed, react documentation recommends
 * unmounting entire component tree and rendering everything from scratch.
 * This would lead too state loss.
 *
 * Instead, this "hacky" component exposes its setProps callback to parent
 * component
 */
function ForwardProps<PROPS extends IR<unknown>>({
  props: initialProps,
  Component,
  setPropsCallback,
}: {
  readonly props: PROPS;
  readonly Component: (props: PROPS) => JSX.Element | null;
  readonly setPropsCallback: (setProps: (newProps: PROPS) => void) => void;
}): JSX.Element {
  const [props, setProps] = React.useState(initialProps);

  React.useEffect(() => {
    setPropsCallback(setProps);
  }, [setPropsCallback]);

  return <Component {...props} />;
}

// FIXME: remove unneded usages
const createBackboneView = <PROPS extends IR<unknown>>(
  Component: (props: PROPS) => JSX.Element | null,
  makeParentContents = true
): new (props?: PROPS & { readonly el?: HTMLElement }) => View & {
  readonly updateProps: (newProps: Partial<PROPS>) => void;
} =>
  ({
    [Component.name]: class extends Backbone.View {
      public options: PROPS & { readonly el?: HTMLElement };

      private setProps: (newProps: PROPS) => void;

      public constructor(options?: PROPS & { readonly el?: HTMLElement }) {
        const { el, ...rest } = options ?? {};
        super({ el });
        this.options = (rest ?? {}) as PROPS;

        // Initial value
        this.setProps = (): void => error('setProps callback is not forwarded');
      }

      /** Save a reference to the setProps callback */
      private saveSetProps(setProps: (newProps: PROPS) => void): void {
        this.setProps = setProps;
      }

      public render(): this {
        if (makeParentContents) this.el.classList.add('contents');
        ReactDOM.render(
          <React.StrictMode>
            <ErrorBoundary>
              <ForwardProps
                Component={Component}
                props={this.options}
                setPropsCallback={this.saveSetProps.bind(this)}
              />
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

      public updateProps(
        newProps: Partial<PROPS> | ((oldProps: PROPS) => PROPS)
      ): void {
        this.options =
          typeof newProps === 'function'
            ? newProps(this.options)
            : { ...this.options, ...newProps };
        this.setProps(this.options);
      }
    },
  }[Component.name]);

export default createBackboneView;
