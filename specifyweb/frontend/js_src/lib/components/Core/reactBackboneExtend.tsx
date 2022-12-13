/**
 * Type-safe React wrapper for Backbone.View
 * It's like a gate between Backbone Views and React components
 *
 * @module
 */

import { default as Backbone, type View } from 'backbone';
import React from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

import { error } from '../Errors/assert';
import type { IR } from '../../utils/types';
import { Contexts } from './Contexts';

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

export const createBackboneView = <PROPS extends IR<unknown>>(
  Component: (props: PROPS) => JSX.Element | null,
  makeParentContents = true
): new (props?: PROPS & { readonly el?: HTMLElement }) => View & {
  readonly updateProps: (newProps: Partial<PROPS>) => void;
} =>
  ({
    [Component.name]: class extends Backbone.View {
      // eslint-disable-next-line functional/prefer-readonly-type
      public options: PROPS & { readonly el?: HTMLElement };

      private readonly root: Root;

      // eslint-disable-next-line functional/prefer-readonly-type
      private setProps: (newProps: PROPS) => void;

      public constructor(options?: PROPS & { readonly el?: HTMLElement }) {
        const { el, ...rest } = options ?? {};
        super({ el });
        this.options = (rest ?? {}) as PROPS;
        this.root = createRoot(this.el);

        // Initial value
        this.setProps = (): void => error('setProps callback is not forwarded');
      }

      /** Save a reference to the setProps callback */
      private saveSetProps(setProps: (newProps: PROPS) => void): void {
        this.setProps = setProps;
      }

      public render(): this {
        if (makeParentContents) this.el.classList.add('contents');
        this.root.render(
          <React.StrictMode>
            <Contexts>
              <ForwardProps
                Component={Component}
                props={this.options}
                setPropsCallback={this.saveSetProps.bind(this)}
              />
            </Contexts>
          </React.StrictMode>
        );
        return this;
      }

      public remove(): this {
        this.root.unmount();
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
