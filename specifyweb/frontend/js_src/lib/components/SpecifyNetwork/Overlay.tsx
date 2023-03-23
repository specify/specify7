import React from 'react';

import { commonText } from '../../localization/common';
import { specifyNetworkText } from '../../localization/specifyNetwork';
import type { GetOrSet, RA, RR } from '../../utils/types';
import { Dialog } from '../Molecules/Dialog';
import { BrokerRecord, extractBrokerField } from './fetchers';
import { useOccurrence, useSpecies } from './hooks';
import type { SpecifyNetworkBadge } from './index';
import { SpecifyNetworkOccurrence, SpecifyNetworkSpecies } from './Table';
import { SpecifyNetworkMap } from './Map';
import { schema } from '../DataModel/schema';

export function SpecifyNetworkOverlays({
  species: localSpecies,
  guid,
  open: [open, setOpen],
}: {
  readonly species: string;
  readonly guid: string;
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
  return open.length === 0 ? null : occurrence?.length === 0 &&
    species?.length === 0 ? (
    <Dialog
      buttons={commonText.close()}
      header={specifyNetworkText.noDataError()}
      onClose={(): void => setOpen([])}
    >
      {specifyNetworkText.noDataErrorDescription()}
    </Dialog>
  ) : (
    <>
      {open.map((badge) => {
        const Component = badges[badge];
        return (
          <Dialog
            buttons={commonText.close()}
            onClose={(): void => setOpen(open.filter((open) => open !== badge))}
            header={schema.models[badge].label}
          >
            <Component
              occurrence={occurrence}
              species={species}
              taxonId={taxonId}
              speciesName={speciesName}
            />
          </Dialog>
        );
      })}
    </>
  );
}

const badges: RR<
  SpecifyNetworkBadge,
  (props: {
    readonly occurrence: RA<BrokerRecord> | undefined;
    readonly species: RA<BrokerRecord> | undefined;
    readonly taxonId: number | undefined;
    readonly speciesName: string | undefined;
  }) => JSX.Element
> = {
  CollectionObject: SpecifyNetworkOccurrence,
  Taxon: SpecifyNetworkSpecies,
  Locality: SpecifyNetworkMap,
};
