/*
 * List of special characters was scraped of Wikipedia
 * (https://en.wikipedia.org/wiki/List_of_Unicode_characters)
 * using the following script:
 * https://github.com/maxxxxxdlp/code_share/blob/66fcd71/JavaScript/special_characters.js
 */

import '../../css/specialcharacters.css';

import React from 'react';

import commonText from '../localization/common';
import specialCharacters from '../specialcharacters.json';
import { closeDialog, LoadingScreen, ModalDialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { useCachedState } from './stateCache';
import type { IR, RA } from './wbplanview';

type Props = IR<never>;

type ComponentProps = {
  readonly onClose: () => void;
};

type Character = {
  readonly code: string;
  readonly glyph: string;
  readonly description: string;
  readonly decimal?: number;
};

const dictionary = specialCharacters as unknown as IR<
  RA<[string, string, string]>
>;

function copyTextToClipboard(text: string): void {
  const textArea = document.createElement('textarea');
  textArea.classList.add('hidden-element');
  textArea.value = text;
  document.body.append(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    if (!successful) console.error('Failed to copy to clipboard');
  } catch (error: unknown) {
    console.error(error);
  }

  textArea.remove();
}

type ActiveElement = {
  readonly element: HTMLInputElement;
  readonly selectionEnd: number;
};

function oMouseOver(
  activeElementRef: React.MutableRefObject<ActiveElement | undefined>
): void {
  const activeElement = document.activeElement as HTMLInputElement | null;
  activeElementRef.current =
    activeElement !== null &&
    typeof activeElement.selectionEnd === 'number' &&
    typeof activeElement.value !== 'undefined'
      ? {
          element: activeElement,
          selectionEnd: activeElement.selectionEnd,
        }
      : undefined;
}

function SpecialCharacters({
  onClose: handleClose,
}: ComponentProps): JSX.Element {
  const [category, setCategory] = useCachedState({
    bucketName: 'common',
    cacheName: 'specialCharactersCategory',
    bucketType: 'localStorage',
    defaultValue: Object.keys(specialCharacters)[0],
  });
  const [preview, setPreview] = React.useState<Character | undefined>(
    undefined
  );

  const glyphsContainerRef = React.useRef<HTMLDivElement | null>(null);
  const activeElementRef = React.useRef<ActiveElement | undefined>(undefined);

  return typeof category === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <ModalDialog
      onLoadCallback={(dialog): void => {
        dialog[0].classList.add('ui-dialog-persistent');
        dialog[0].closest('.ui-dialog')?.classList.add('ui-dialog-persistent');
      }}
      properties={{
        title: commonText('specialCharacters'),
        close: handleClose,
        width: 600,
        height: 400,
        modal: false,
        position: { at: 'bottom' },
        buttons: [
          {
            text: commonText('close'),
            click: closeDialog,
          },
        ],
      }}
    >
      <div
        className="special-characters-content"
        onMouseOver={(): void => oMouseOver(activeElementRef)}
        onFocus={(): void => oMouseOver(activeElementRef)}
      >
        <select
          className="special-characters-categories"
          value={category}
          onChange={(event): void => {
            if (glyphsContainerRef.current)
              glyphsContainerRef.current.scrollTop = 0;
            setCategory(event.target.value);
          }}
          size={2}
        >
          {Object.keys(dictionary).map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <div className="special-characters-scroll" ref={glyphsContainerRef}>
          <div className="special-characters-glyphs">
            {Object.values(dictionary[category]).map(
              ([code, glyph, description, decimal = undefined]) => (
                <button
                  key={code}
                  type="button"
                  className="special-character"
                  title={description}
                  onMouseOver={(): void =>
                    setPreview({ code, glyph, description, decimal })
                  }
                  onFocus={(event): void => {
                    event.preventDefault();
                    setPreview({ code, glyph, description, decimal });
                  }}
                  onMouseDown={(event): void => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={(): void => {
                    if (activeElementRef.current) {
                      activeElementRef.current.element.value = `${activeElementRef.current.element.value.slice(
                        0,
                        activeElementRef.current.selectionEnd
                      )}${glyph}${activeElementRef.current.element.value.slice(
                        activeElementRef.current.selectionEnd
                      )}`;
                      activeElementRef.current = {
                        ...activeElementRef.current,
                        selectionEnd: activeElementRef.current.selectionEnd + 1,
                      };
                    } else copyTextToClipboard(glyph);
                  }}
                >
                  {glyph}
                </button>
              )
            )}
          </div>
        </div>
        <div className="special-characters-centered">
          <div className="special-characters-preview">
            {typeof preview === 'undefined' ? undefined : (
              <>
                <span className="special-character-glyph">{preview.glyph}</span>
                <span className="special-character-code">{preview.code}</span>
                <span className="special-character-description">
                  {preview.description}
                </span>
                {typeof preview.decimal === 'number' && (
                  <span className="special-character-decimal">
                    alt-{preview.decimal}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ModalDialog>
  );
}

export default createBackboneView<Props, Props, ComponentProps>({
  moduleName: 'SpecialCharacters',
  className: 'special-characters',
  Component: SpecialCharacters,
  getComponentProps: (self) => ({
    onClose: self.remove.bind(self),
  }),
});
