import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { headerText } from '../../localization/header';
import { Button } from '../Atoms/Button';
import { ImageViewer } from '../Attachments/ImageViewer';

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
        <ImageViewer
          alt="Chrono Chart"
          header={headerText.chronostratigraphicChart()}
          src="/static/img/chronostratChart2023-09.jpg"
          onClose={handleHideChronoChart}
        />
      )}
    </>
  );
}