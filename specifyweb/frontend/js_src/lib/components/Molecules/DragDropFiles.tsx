import React from 'react';

function preventPropagation(event: React.DragEvent): void {
  event.preventDefault();
  event.stopPropagation();
}

export function useDragDropFiles(
  onFileChange: ((fileList: FileList) => void) | undefined,
  forwardRef: React.RefObject<HTMLElement>
): {
  readonly isDragging: boolean;
  readonly onDrop: (event: React.DragEvent) => void;
  readonly onDragLeave: (event: React.DragEvent) => void;
  readonly onDragEnter: (event: React.DragEvent) => void;
  readonly onDragOver: (event: React.DragEvent) => void;
} {
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  function handleFileDropped(event: React.DragEvent): void {
    const fileList = event.dataTransfer?.files ?? undefined;
    onFileChange?.(fileList);
    preventPropagation(event);
    setIsDragging(false);
  }
  function handleDragEnter(event: React.DragEvent): void {
    setIsDragging(
      typeof onFileChange === 'function' &&
        ((event.dataTransfer?.files?.length ?? 0) !== 0 ||
          (event.dataTransfer?.items.length ?? 0) !== 0)
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
  return {
    isDragging,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDrop: handleFileDropped,
    onDragOver: preventPropagation,
  };
}
