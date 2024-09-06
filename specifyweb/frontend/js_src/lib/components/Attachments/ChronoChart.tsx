import React from 'react';

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
        title="chronoChart"
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
          {/* TODO: Replace with chrono image */}
          <img
            alt=""
            className="hover:animate-hue-rotate max-w-xs"
            src="/static/img/logo.svg"
            style={{ filter: `hue-rotate(30deg)` }}
          />
        </Dialog>
      )}
    </>
  );
}
