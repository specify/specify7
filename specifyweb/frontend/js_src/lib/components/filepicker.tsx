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
        required
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

/**
 * A hacky way to download a file on the front-end
 * May stop working in the future
 *
 * @remarks
 * This method worked before 2019:
 * https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
 * Now, it only works if link is inside the iframe, which is achieved with
 * help from this code:
 * https://stackoverflow.com/a/10433550/8584605
 *
 */
export async function downloadFile(
  fileName: string,
  text: string
): Promise<void> {
  const iframe = document.createElement('iframe');
  iframe.addEventListener('load', () => {
    if (iframe.contentWindow === null) return;
    const element = iframe.contentWindow.document.createElement('a');
    element.setAttribute(
      'href',
      `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
    );
    element.setAttribute('download', fileName);

    element.style.display = 'none';
    iframe.contentWindow.document.body.append(element);

    element.click();
    setTimeout(() => iframe.remove(), 100);
  });
  const html = '<body>Foo</body>';
  document.body.append(iframe);
  iframe.contentWindow.document.open();
  iframe.contentWindow.document.write(html);
  iframe.contentWindow.document.close();
}

export const fileToText = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.addEventListener('load', ({ target }) =>
      typeof target?.result === 'string'
        ? resolve(target.result)
        : reject(new Error('File is not a text file'))
    );
    fileReader.readAsText(file);
  });
