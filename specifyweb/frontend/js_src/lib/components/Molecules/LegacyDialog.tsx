import type jQuery from 'jquery';
import React from 'react';

import { Dialog, dialogClassNames } from './Dialog';
import { createBackboneView } from '../Core/reactBackboneExtend';

// REFACTOR: get rid of this once everything is using React

/** Wrapper for using React dialog in Backbone views */
function LegacyDialogWrapper({
  content,
  ...props
}: Omit<Parameters<typeof Dialog>[0], 'children' | 'isOpen'> & {
  readonly content: HTMLElement | string | typeof jQuery;
}): JSX.Element {
  const [contentElement, setContentElement] =
    React.useState<HTMLElement | null>(null);
  const isJsx = typeof content === 'object' && 'ref' in content;
  React.useEffect(
    () =>
      isJsx
        ? undefined
        : contentElement?.replaceChildren(
            typeof content === 'object' && 'jquery' in content
              ? (content[0] as HTMLElement)
              : (content as HTMLElement)
          ),
    [isJsx, content, contentElement]
  );

  return (
    <Dialog
      {...props}
      className={{
        ...props.className,
        container:
          props.className?.container ?? dialogClassNames.normalContainer,
      }}
      forwardRef={{ content: setContentElement }}
    >
      {isJsx ? content : undefined}
    </Dialog>
  );
}

const dialogClass = createBackboneView(LegacyDialogWrapper);

export const showDialog = (
  props: ConstructorParameters<typeof dialogClass>[0]
) => {
  const view = new dialogClass(props).render();

  /*
   * Removed Backbone components may leave dangling dialogs
   * This helps SpecifyApp.js clean them up
   */
  if (props?.forceToTop !== true) {
    const originalDestructor = view.remove.bind(view);
    view.remove = (): typeof view => {
      originalDestructor();
      return view;
    };
  }

  return view;
};
