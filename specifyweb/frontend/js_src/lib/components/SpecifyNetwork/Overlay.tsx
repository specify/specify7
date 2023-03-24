import React from 'react';

import { commonText } from '../../localization/common';
import { specifyNetworkText } from '../../localization/specifyNetwork';
import type { GetOrSet, RA, RR } from '../../utils/types';
import { Dialog } from '../Molecules/Dialog';
import type { BrokerRecord } from './fetchers';
import { extractBrokerField } from './fetchers';
import { useOccurrence, useSpecies } from './hooks';
import type { SpecifyNetworkBadge } from './index';
import { SpecifyNetworkMap } from './Map';
import { SpecifyNetworkOccurrence, SpecifyNetworkSpecies } from './Table';

export function SpecifyNetworkOverlays({
  species: localSpecies,
  guid,
  taxonId,
  open: [open, setOpen],
}: {
  readonly species: string;
  readonly guid: string;
  readonly taxonId: number | undefined | false;
  readonly open: GetOrSet<RA<SpecifyNetworkBadge>>;
}): JSX.Element | null {
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
  return open.length === 0 ? null : (
    <>
      {open.map((badge) => {
        const Component = badges[badge];
        return (
          <Component
            key={badge}
            occurrence={occurrence}
            species={species}
            speciesName={speciesName}
            taxonId={taxonId}
            onClose={(): void => setOpen(open.filter((open) => open !== badge))}
          />
        );
      })}
    </>
  );
}

export function NoBrokerData({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={commonText.close()}
      header={specifyNetworkText.noDataError()}
      onClose={handleClose}
    >
      {specifyNetworkText.noDataErrorDescription()}
    </Dialog>
  );
}

const badges: RR<
  SpecifyNetworkBadge,
  (props: {
    readonly occurrence: RA<BrokerRecord> | undefined;
    readonly species: RA<BrokerRecord> | undefined;
    readonly taxonId: number | false | undefined;
    readonly speciesName: string | undefined;
    readonly onClose: () => void;
  }) => JSX.Element
> = {
  CollectionObject: SpecifyNetworkOccurrence,
  Taxon: SpecifyNetworkSpecies,
  Locality: SpecifyNetworkMap,
};
