import React from 'react';

function preventPropagation(event: React.DragEvent): void {
  event.preventDefault();
  event.stopPropagation();
}
export function DragDropFiles({
  onFileChange: handleFileChange,
  onFocus: handleFocus,
  onBlur: handleBlur,
  forwardRef,
  children,
}: {
  readonly onFileChange: ((fileList: FileList) => void) | undefined;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
  readonly forwardRef: React.RefObject<HTMLElement>;
  readonly children: (props: { readonly isDragging: boolean }) => JSX.Element;
}): JSX.Element {
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  function handleFileDropped(event: React.DragEvent): void {
    const fileList = event.dataTransfer?.files ?? undefined;
    handleFileChange?.(fileList);
    preventPropagation(event);
    setIsDragging(false);
  }
  function handleDragEnter(event: React.DragEvent): void {
    setIsDragging(
      (event.dataTransfer?.files?.length ?? 0) !== 0 ||
        (event.dataTransfer?.items.length ?? 0) !== 0
    );
    preventPropagation(event);
  }
  function handleDragLeave(event: React.DragEvent): void {
    if (
      event.relatedTarget === null ||
      forwardRef.current === null ||
      event.target !== forwardRef.current ||
      forwardRef.current.contains(event.relatedTarget as Node)
    )
      return;
    setIsDragging(false);
    preventPropagation(event);
  }
  return (
    <label
      className="contents"
      onBlur={handleBlur}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={preventPropagation}
      onDrop={handleFileDropped}
      onFocus={handleFocus}
    >
      {children({
        isDragging: isDragging && typeof handleFileChange === 'function',
      })}
    </label>
  );
}
