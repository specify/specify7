import React from 'react';

import commonText from '../localization/common';
import type { RA } from '../types';
import { useBooleanState } from './hooks';

export function FilePicker({
  onSelected: handleSelected,
  acceptedFormats,
  id,
  name,
}: {
  readonly onSelected: (file: File) => void;
  readonly acceptedFormats: RA<string> | undefined;
  // Whether to automatically click on the file input as soon as rendered
  readonly id?: string;
  readonly name?: string;
}): JSX.Element {
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const filePickerButton = React.useRef<HTMLButtonElement>(null);

  function handleFileSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    if (handleFileChange(event.target.files?.[0])) event.target.value = '';
  }

  function handleFileDropped(event: React.DragEvent): void {
    const file = event.dataTransfer?.items?.[0].getAsFile() ?? undefined;
    handleFileChange(file);
    preventPropagation(event);
    setIsDragging(false);
  }

  function handleFileChange(file: File | undefined): boolean {
    if (file) {
      handleSelected(file);
      setFileName(file.name);
      return true;
    } else {
      setFileName(undefined);
      return false;
    }
  }

  function handleDragEnter(event: React.DragEvent): void {
    setIsDragging(event.dataTransfer?.items?.length !== 0 ?? false);
    preventPropagation(event);
  }

  function handleDragLeave(event: React.DragEvent): void {
    if (
      event.relatedTarget === null ||
      filePickerButton.current === null ||
      event.target !== filePickerButton.current ||
      filePickerButton.current.contains(event.relatedTarget as Node)
    )
      return;
    setIsDragging(false);
    preventPropagation(event);
  }

  function preventPropagation(event: React.DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  const [fileName, setFileName] = React.useState<string | undefined>(undefined);
  const [isFocused, handleFocus, handleBlur] = useBooleanState();

  return (
    <label
      className="contents"
      onDrop={handleFileDropped}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={preventPropagation}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <input
        type="file"
        accept={acceptedFormats?.join(',')}
        onChange={handleFileSelected}
        className="sr-only"
        id={id}
        name={name}
      />
      <span
        ref={filePickerButton}
        className={`align-center button h-44 flex justify-center text-center
          ${
            isDragging
              ? 'bg-white dark:bg-neutral-700 ring ring-brand-200 dark:ring-brand-400'
              : ''
          }
          ${isFocused ? 'ring' : ''} col-span-2`}
      >
        <span>
          {commonText('filePickerMessage')}
          {typeof fileName === 'string' && (
            <>
              <br />
              <br />
              <b>{commonText('selectedFileName')(fileName)}</b>
            </>
          )}
        </span>
      </span>
    </label>
  );
}
