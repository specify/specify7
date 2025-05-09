import React from 'react';
import {
  TransformComponent,
  TransformWrapper,
  useControls,
} from 'react-zoom-pan-pinch';

import { commonText } from '../../localization/common';
import { Button } from '../Atoms/Button';

export function ImageViewer({
  src,
  alt,
}: {
  readonly src: string;
  readonly alt: string;
}): JSX.Element {
  return (
    <TransformWrapper centerOnInit>
      <div
        className="flex flex-col items-center justify-center h-full w-full"
        style={
          {
            '--transition-duration': 0,
          } as React.CSSProperties
        }
      >
        <TransformComponent>
          <img
            alt={alt}
            className="max-w-full max-h-[70vh] object-contain"
            src={src}
          />
        </TransformComponent>
        <div className="flex gap-2 mt-4">
          <Controls />
        </div>
      </div>
    </TransformWrapper>
  );
}

function Controls(): JSX.Element {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <>
      <Button.Icon
        icon="plus"
        title={commonText.zoom()}
        onClick={(): void => zoomIn()}
      />
      <Button.Icon
        icon="minus"
        title={commonText.unzoom()}
        onClick={(): void => zoomOut()}
      />
      <Button.Icon
        icon="arrowPath"
        title={commonText.reset()}
        onClick={(): void => resetTransform()}
      />
    </>
  );
}
