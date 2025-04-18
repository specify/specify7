import React from 'react';
import {
  TransformComponent,
  TransformWrapper,
  useControls,
} from 'react-zoom-pan-pinch';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { Button } from '../Atoms/Button';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';

export function ImageViewer({
  src,
  alt,
  header,
  onClose,
  modal,
}: {
  src: string;
  alt: string;
  header: LocalizedString;
  onClose: () => void;
  modal?: boolean;
}): JSX.Element {
  return (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      className={{
        container: dialogClassNames.wideContainer,
      }}
      header={header}
      modal={modal}
      onClose={onClose}
    >
      <TransformWrapper>
        <div className="flex flex-col items-center justify-center h-full w-full">
          <TransformComponent>
            <img
              alt={alt}
              className="max-w-full max-h-full object-contain"
              src={src}
              width="100%"
            />
          </TransformComponent>
          <div className="flex gap-2 mt-4">
            <Controls />
          </div>
        </div>
      </TransformWrapper>
    </Dialog>
  );
}

function Controls(): JSX.Element {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <>
      <Button.Icon
        icon="plus"
        title={commonText.zoom()}
        onClick={() => zoomIn()}
      />
      <Button.Icon
        icon="minus"
        title={commonText.unzoom()}
        onClick={() => zoomOut()}
      />
      <Button.Icon
        icon="arrowsExpand"
        title={commonText.reset()}
        onClick={() => resetTransform()}
      />
    </>
  );
}
