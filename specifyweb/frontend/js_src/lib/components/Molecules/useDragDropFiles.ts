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
  readonly callbacks: {
    readonly onDrop: (event: React.DragEvent) => void;
    readonly onDragLeave: (event: React.DragEvent) => void;
    readonly onDragEnter: (event: React.DragEvent) => void;
    readonly onDragOver: (event: React.DragEvent) => void;
  };
} {
  const [isDragging, setIsDragging] = React.useState<boolean>(false);

  const handleFileDropped = React.useCallback(
    (event: React.DragEvent) => {
      const fileList = event.dataTransfer?.files ?? undefined;
      onFileChange?.(fileList);
      preventPropagation(event);
      setIsDragging(false);
    },
    [setIsDragging, onFileChange]
  );

  const handleDragEnter = React.useCallback(
    (event: React.DragEvent) => {
      setIsDragging(
        typeof onFileChange === 'function' &&
          ((event.dataTransfer?.files?.length ?? 0) !== 0 ||
            (event.dataTransfer?.items.length ?? 0) !== 0)
      );
      preventPropagation(event);
    },
    [onFileChange, setIsDragging]
  );

  const handleDragLeave = React.useCallback(
    (event: React.DragEvent) => {
      if (
        event.relatedTarget === null ||
        forwardRef.current === null ||
        event.target !== forwardRef.current ||
        forwardRef.current.contains(event.relatedTarget as Node)
      )
        return;
      setIsDragging(false);
      preventPropagation(event);
    },
    [setIsDragging]
  );

  return {
    isDragging,
    callbacks: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDrop: handleFileDropped,
      onDragOver: preventPropagation,
    },
  };
}
