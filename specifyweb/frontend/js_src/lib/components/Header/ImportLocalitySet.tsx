import React from 'react';

import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { localityText } from '../../localization/locality';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Submit } from '../Atoms/Submit';
import { tables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { CsvFilePicker } from '../Molecules/FilePicker';

type Header = Exclude<
  Lowercase<
    | keyof Tables['GeoCoordDetail']['fields']
    | keyof Tables['Locality']['fields']
  >,
  'locality'
>;

const acceptedLocalityFields: RA<
  Lowercase<keyof Tables['Locality']['fields']>
> = ['guid', 'datum', 'latitude1', 'longitude1'];

const acceptedHeaders = new Set([
  ...acceptedLocalityFields,
  ...tables.GeoCoordDetail.literalFields
    .map(({ name }) => name.toLowerCase())
    .filter((header) => header !== 'locality'),
]);

const requiredHeaders = new Set<Header>(['guid']);

export function ImportLocalitySet(): JSX.Element {
  const [headerErrors, setHeaderErrors] = React.useState({
    missingRequiredHeaders: [] as RA<Header>,
    unrecognizedHeaders: [] as RA<string>,
  });

  return (
    <>
      <CsvFilePicker
        header={headerText.coGeImportDataset()}
        onFileImport={({ data }): void => {
          const headers = data[0];
          const foundHeaderErrors = headers.reduce(
            (accumulator, currentHeader) => {
              const parsedHeader = currentHeader.toLowerCase() as Header;
              const isUnknown = !acceptedHeaders.has(parsedHeader);

              return {
                missingRequiredHeaders:
                  accumulator.missingRequiredHeaders.filter(
                    (header) => header !== parsedHeader
                  ),
                unrecognizedHeaders: isUnknown
                  ? [...accumulator.unrecognizedHeaders, currentHeader]
                  : accumulator.unrecognizedHeaders,
              };
            },
            {
              missingRequiredHeaders: Array.from(requiredHeaders) as RA<Header>,
              unrecognizedHeaders: [] as RA<string>,
            }
          );
          setHeaderErrors(foundHeaderErrors);
          if (
            Object.values(foundHeaderErrors).some((errors) => errors.length > 0)
          )
            return;
        }}
      />
      {Object.values(headerErrors).some((errors) => errors.length > 0) && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.close()}</Button.DialogClose>
              {headerErrors.missingRequiredHeaders.length === 0 && (
                <Submit.Save>{commonText.import()}</Submit.Save>
              )}
            </>
          }
          header={localityText.localityImportHeaderError()}
          icon={
            headerErrors.missingRequiredHeaders.length === 0
              ? 'warning'
              : 'error'
          }
          onClose={(): void =>
            setHeaderErrors({
              missingRequiredHeaders: [],
              unrecognizedHeaders: [],
            })
          }
        >
          <>
            {headerErrors.missingRequiredHeaders.length > 0 && (
              <>
                <H2>{localityText.localityImportMissingHeader()}</H2>
                <p>{headerErrors.missingRequiredHeaders.join(', ')}</p>
              </>
            )}
            {headerErrors.unrecognizedHeaders.length > 0 && (
              <>
                <H2>{localityText.localityImportUnrecognizedHeaders()}</H2>
                <p>{headerErrors.unrecognizedHeaders.join(', ')}</p>
              </>
            )}
            <H2>{localityText.localityImportedAcceptedHeaders()}</H2>
            <p>{Array.from(acceptedHeaders).join(', ')}</p>
          </>
        </Dialog>
      )}
    </>
  );
}
