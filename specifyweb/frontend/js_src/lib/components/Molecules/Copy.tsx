import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { Button } from '../Atoms/Button';
import { softFail } from '../Errors/Crash';

const copyMessageTimeout = 3000;

export function CopyButton({
  text,
  label = commonText.copyToClipboard(),
}: {
  readonly text: string;
  readonly label?: LocalizedString;
}): JSX.Element {
  const [wasCopied, handleCopied, handleNotCopied] = useBooleanState();
  return (
    <Button.Success
      className="whitespace-nowrap"
      onClick={(): void =>
        void copyTextToClipboard(text).then((): void => {
          handleCopied();
          globalThis.setTimeout(handleNotCopied, copyMessageTimeout);
        })
      }
    >
      {wasCopied ? commonText.copied() : label}
    </Button.Success>
  );
}

export const copyTextToClipboard = async (text: string): Promise<void> =>
  /**
   * "navigator.clipboard" is only available on HTTPs origins
   * Not available over Http, unless on localhost
   */
  (
    globalThis.navigator.clipboard?.writeText(text).catch(async (error) => {
      console.error(error);
      return fallbackCopyTextToClipboard(text);
    }) ?? fallbackCopyTextToClipboard(text)
  ).catch(softFail);

/** Based on https://stackoverflow.com/a/30810322/8584605 */
async function fallbackCopyTextToClipboard(text: string): Promise<void> {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.classList.add('sr-only');

  document.body.append(textArea);
  textArea.focus();
  textArea.select();

  const promise = document.execCommand('copy')
    ? Promise.resolve()
    : Promise.reject(new Error('Failed to copy text to clipboard'));

  textArea.remove();
  return promise;
}
