import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { className } from '../Atoms/className';
import { attachmentsText } from '../../localization/attachments';
import { TagProps } from '../Atoms/wrapper';
import { DragDropFiles } from './DragDropFiles';

export function FilePicker({
  acceptedFormats,
  id,
  name,
  showFileNames = true,
  ...rest
}: {
  readonly acceptedFormats: RA<string> | undefined;
  // Whether to automatically click on the file input as soon as rendered
  readonly id?: string;
  readonly name?: string;
  readonly showFileNames?: boolean;
} & (
  | { readonly onFileSelected: (file: File) => void }
  | { readonly onFilesSelected: (files: FileList) => void }
) &
  Partial<TagProps<'button'>>): JSX.Element {
  const allowMultiple = 'onFilesSelected' in rest;
  const filePickerButton = React.useRef<HTMLButtonElement>(null);

  function handleFileSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    if (handleFileChange(event.target.files ?? undefined))
      event.target.value = '';
  }

  function handleFileChange(files: FileList | undefined): boolean {
    if (files !== undefined && files.length > 0) {
      if (allowMultiple) {
        rest.onFilesSelected(files);
        setFileName(attachmentsText.multipleFilesSelected());
      } else {
        rest.onFileSelected(files[0]);
        setFileName(files[0].name);
      }

      return true;
    } else {
      setFileName(undefined);
      return false;
    }
  }

  const [fileName, setFileName] = React.useState<string | undefined>(undefined);
  const [isFocused, handleFocus, handleBlur] = useBooleanState();

  return (
    <DragDropFiles
      forwardRef={filePickerButton}
      onBlur={handleBlur}
      onFileChange={handleFileChange}
      onFocus={handleFocus}
    >
      {({ isDragging }) => (
        <>
          <input
            accept={acceptedFormats?.join(',')}
            className="sr-only"
            id={id}
            name={name}
            required
            type="file"
            onChange={handleFileSelected}
            multiple={allowMultiple}
            disabled={rest.disabled}
          />
          <span
            className={`
          align-center flex min-w-fit justify-center text-center normal-case
          ${className.secondaryButton}
          ${className.niceButton}
          ${
            isDragging
              ? 'bg-white ring ring-brand-200 dark:bg-neutral-700 dark:ring-brand-400'
              : ''
          }
          ${isFocused ? '!ring ring-blue-500' : ''}
        `}
            ref={filePickerButton}
          >
            <span>
              {commonText.filePickerMessage()}
              {showFileNames && typeof fileName === 'string' && (
                <>
                  <br />
                  <br />
                  <b>
                    {commonText.colonLine({
                      label: commonText.selectedFileName(),
                      value: fileName,
                    })}
                  </b>
                </>
              )}
            </span>
          </span>
        </>
      )}
    </DragDropFiles>
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
export const downloadFile = async (
  fileName: string,
  text: string
): Promise<void> =>
  new Promise((resolve) => {
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
      globalThis.setTimeout(() => {
        iframe.remove();
        resolve();
      }, 100);
    });
    const html = '<body></body>';
    document.body.append(iframe);
    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(html);
    iframe.contentWindow?.document.close();
  });

export const fileToText = async (
  file: File,
  encoding = 'utf-8'
): Promise<string> =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.addEventListener('load', ({ target }) =>
      typeof target?.result === 'string'
        ? resolve(target.result)
        : reject(new Error('File is not a text file'))
    );
    fileReader.addEventListener('error', () => reject(fileReader.error));
    fileReader.readAsText(file, encoding);
  });
