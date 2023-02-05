import React from 'react';

import { overwriteReadOnly } from '../../utils/types';
import { className } from '../Atoms/className';
import { Textarea } from '../Atoms/Form';

export function AutoGrowTextArea({
  containerClassName = '',
  ...props
}: Parameters<typeof Textarea>[0] & {
  readonly containerClassName?: string;
}): JSX.Element {
  const [textArea, setTextArea] = React.useState<HTMLTextAreaElement | null>(
    null
  );
  const [shadow, setShadow] = React.useState<HTMLDivElement | null>(null);
  /*
   * If user manually resized the textarea, need to keep the shadow in sync
   * Fixes https://github.com/specify/specify7/issues/1783
   * Can't simply convert auto growing textarea into a regular one on the fly
   * because that interrupts the resize operation
   */
  React.useEffect(() => {
    if (
      textArea === null ||
      shadow === null ||
      globalThis.ResizeObserver === undefined
    )
      return undefined;
    const observer = new globalThis.ResizeObserver(() => {
      shadow.style.height = textArea.style.height;
      shadow.style.width = textArea.style.width;
    });
    observer.observe(textArea);
    return (): void => observer.disconnect();
  }, [textArea, shadow]);

  React.useEffect(() => {
    if (typeof props.forwardRef === 'function') props.forwardRef(textArea);
    else if (
      typeof props.forwardRef === 'object' &&
      props.forwardRef !== null &&
      'current' in props.forwardRef
    )
      /* REFACTOR: improve typing to make this editable */
      overwriteReadOnly(props.forwardRef, 'current', textArea);
  }, [textArea, props.forwardRef]);
  return (
    <div
      className={`
        relative min-h-[calc(theme(spacing.7)*var(--rows))] overflow-hidden
        ${containerClassName}
      `}
      style={{ '--rows': props.rows ?? 3 } as React.CSSProperties}
    >
      {/*
       * Shadow a textarea with a div, allowing it to autoGrow. Source:
       * https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/
       */}
      <div
        className={`
          textarea-shadow invisible whitespace-pre-wrap [grid-area:1/1/2/2]
          print:hidden ${className.textArea}
        `}
        ref={setShadow}
      >
        {`${props.value?.toString() ?? ''} `}
      </div>
      <Textarea
        {...props}
        className={`
          absolute top-0 h-full [grid-area:1/1/2/2]
          ${props.className ?? ''}
        `}
        forwardRef={setTextArea}
      />
    </div>
  );
}
