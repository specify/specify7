import React from 'react';

import { useSearchParameter } from '../../hooks/navigation';
import { commonText } from '../../localization/common';
import { specifyNetworkText } from '../../localization/specifyNetwork';
import { loadingGif } from '../Molecules';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';
import { extractBrokerField } from './fetchers';
import { useOccurrence, useSpecies } from './hooks';
import { SpecifyNetworkTable } from './Table';

export function SpecifyNetworkOverlay(): JSX.Element {
  const [species = ''] = useSearchParameter('species');
  const [guid = ''] = useSearchParameter('guid');
  const handleClose = React.useContext(OverlayContext);
  return species.length === 0 && guid.length === 0 ? (
    <Dialog
      buttons={commonText.close()}
      header={specifyNetworkText.specifyNetwork()}
      onClose={handleClose}
    >
      {specifyNetworkText.occurrenceOrGuidRequired()}
    </Dialog>
  ) : (
    <Overlay guid={guid} species={species} />
  );
}

function Overlay({
  species: localSpecies,
  guid,
}: {
  readonly species: string;
  readonly guid: string;
}): JSX.Element {
  const occurrence = useOccurrence(guid);
  const occurrenceSpeciesName = React.useMemo(
    () =>
      // Prefer the species name from an aggregator over local as it is more trustworthy
      occurrence === undefined
        ? undefined
        : extractBrokerField(occurrence, 'gbif', 'dwc:scientificName') ??
          localSpecies,
    [occurrence, localSpecies]
  );
  const species = useSpecies(occurrenceSpeciesName);
  const speciesName = React.useMemo(
    () =>
      (typeof species === 'object'
        ? extractBrokerField(species, 'gbif', 'dwc:scientificName') ??
          extractBrokerField(species, 'gbif', 's2n:scientific_name')
        : undefined) ?? occurrenceSpeciesName,
    [species, occurrenceSpeciesName]
  );
  const handleClose = React.useContext(OverlayContext);
  return occurrence?.length === 0 && species?.length === 0 ? (
    <Dialog
      buttons={commonText.close()}
      header={specifyNetworkText.noDataError()}
      onClose={handleClose}
    >
      {specifyNetworkText.noDataErrorDescription()}
    </Dialog>
  ) : (
    <Dialog
      buttons={commonText.close()}
      className={{
        container: dialogClassNames.wideContainer,
      }}
      header={speciesName ?? specifyNetworkText.specifyNetwork()}
      onClose={handleClose}
    >
      {occurrence === undefined ? (
        loadingGif
      ) : (
        <SpecifyNetworkTable
          occurrence={occurrence}
          species={species}
          speciesName={speciesName}
        />
      )}
    </Dialog>
  );
}
