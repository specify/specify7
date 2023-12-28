import React from 'react';

import { useStateForContext } from '../../hooks/useStateForContext';
import { headerText } from '../../localization/header';
import { CsvFilePicker } from '../Molecules/FilePicker';
import { OverlayContext } from '../Router/Router';

export function ImportFromCoge(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  const getSetHeader = useStateForContext(true);
  return (
    <CsvFilePicker
      getSetHasHeader={getSetHeader}
      header={headerText.coGeImportDataset()}
      onFileImport={(): void => console.error('yo!')}
      onFileSelected={(file): void => {}}
    />
  );
}
