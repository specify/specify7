import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { Button } from '../Atoms/Button';
import { ImageViewer } from '../Attachments/ImageViewer';
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
          <ImageViewer
            alt="Chrono Chart"
            src="/static/img/chronostratChart2023-09.jpg"
          />
        </Dialog>
      )}
    </>
  );
}