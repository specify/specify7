import React from 'react';
import {
  TransformComponent,
  TransformWrapper,
  useControls,
} from 'react-zoom-pan-pinch';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { Button } from '../Atoms/Button';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';

export function ChronoChart(): JSX.Element {
  const [showChronoChart, handleShowChronoChart, handleHideChronoChart] =
    useBooleanState();

  return (
    <>
      <Button.Icon
        icon="clock"
        title="Chronostratigraphic Chart"
        onClick={handleShowChronoChart}
      />
      {showChronoChart && (
        <Dialog
          buttons={
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          }
          className={{
            container: dialogClassNames.wideContainer,
          }}
          header={headerText.chronostratigraphicChart()}
          onClose={handleHideChronoChart}
        >
          <TransformWrapper>
            <div className="flex items-center justify-between">
              <TransformComponent>
                <img
                  alt="Chrono Chart"
                  className="h-[70vh]"
                  src="/static/img/chronostratChart2023-09.jpg"
                  width="100%"
                />
              </TransformComponent>
              <Controls />
            </div>
          </TransformWrapper>
        </Dialog>
      )}
    </>
  );
}

function Controls(): JSX.Element {
  const { zoomIn, zoomOut } = useControls();
  return (
    <div className="flex flex-col">
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
    </div>
  );
}
