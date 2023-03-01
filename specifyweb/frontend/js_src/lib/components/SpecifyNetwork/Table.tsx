import React from 'react';

import { specifyNetworkText } from '../../localization/specifyNetwork';
import type { IR, RA } from '../../utils/types';
import { schema } from '../DataModel/schema';
import { loadingGif } from '../Molecules';
import { SpecifyNetworkMap } from '../SpecifyNetworkMap';
import { BrokerRow, BrokerSection, BrokerTable } from './Components';
import type { BrokerRecord } from './fetchers';
import { extractBrokerField } from './fetchers';
import { SpecifyNetworkResponse } from './Response';

export function SpecifyNetworkTable({
  occurrence,
  species,
  speciesName,
}: {
  readonly occurrence: RA<BrokerRecord> | undefined;
  readonly species: RA<BrokerRecord> | undefined;
  readonly speciesName: string | undefined;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-8">
      {typeof occurrence === 'object' && occurrence.length > 0 ? (
        <>
          <IssuesTable occurrence={occurrence} />
          <OccurrenceTable occurrence={occurrence} />
        </>
      ) : undefined}
      {typeof species === 'object' ? (
        <>
          <SpeciesTable species={species} />
          {typeof speciesName === 'string' && (
            <SpecifyNetworkMap
              occurrence={occurrence}
              species={species}
              speciesName={speciesName}
            />
          )}
        </>
      ) : (
        <BrokerSection anchor="name" label={schema.models.Taxon.label}>
          {loadingGif}
        </BrokerSection>
      )}
    </div>
  );
}

function IssuesTable({
  occurrence,
}: {
  readonly occurrence: RA<BrokerRecord>;
}): JSX.Element | null {
  const issues = occurrence.filter(
    ({ record }) => Object.keys(record['s2n:issues'] as IR<string>).length > 0
  );

  return issues.length === 0 ? null : (
    <BrokerSection anchor="issues" label={specifyNetworkText.dataQuality()}>
      <BrokerTable className="issues">
        {issues.map(({ provider, record }) => (
          <BrokerRow
            cells={[
              <ul key="list">
                {Object.entries(record['s2n:issues'] as IR<string>).map(
                  ([key, message]) => (
                    <li key={key}>{`${message} (${key})`}</li>
                  )
                )}
              </ul>,
            ]}
            header={specifyNetworkText.reportedBy({ provider: provider.label })}
            key={provider.code}
          />
        ))}
      </BrokerTable>
    </BrokerSection>
  );
}

function OccurrenceTable({
  occurrence,
}: {
  readonly occurrence: RA<BrokerRecord>;
}): JSX.Element {
  const formattedSpecimenId =
    extractBrokerField(occurrence, 'mopho', 'mopho:specimen.specimen_id') ??
    extractBrokerField(occurrence, 'mopho', 's2n:view_url');

  const alteredResponse = occurrence
    .filter((record) => record.provider.code !== 'mopho')
    .map((response) => ({
      ...response,
      record: {
        ...response.record,
        'mopho:specimen.specimen_id':
          response.record['mopho:specimen.specimen_id'] || formattedSpecimenId,
      },
    }));

  return (
    <BrokerSection anchor="occ" label={schema.models.CollectionObject.label}>
      <SpecifyNetworkResponse responses={alteredResponse} />
    </BrokerSection>
  );
}

function SpeciesTable({
  species,
}: {
  readonly species: RA<BrokerRecord>;
}): JSX.Element {
  return (
    <BrokerSection anchor="name" label={schema.models.Taxon.label}>
      <SpecifyNetworkResponse responses={species} />
    </BrokerSection>
  );
}
