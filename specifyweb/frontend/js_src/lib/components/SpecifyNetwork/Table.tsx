import React from 'react';

import { specifyNetworkText } from '../../localization/specifyNetwork';
import type { IR, RA } from '../../utils/types';
import { schema } from '../DataModel/schema';
import { loadingGif } from '../Molecules';
import { BrokerRow, BrokerSection, BrokerTable } from './Components';
import type { BrokerRecord } from './fetchers';
import { extractBrokerField } from './fetchers';
import { SpecifyNetworkResponse } from './Response';

export function SpecifyNetworkOccurrence({
  occurrence,
}: {
  readonly occurrence: RA<BrokerRecord> | undefined;
}): JSX.Element | null {
  return typeof occurrence === 'object' && occurrence.length > 0 ? (
    <>
      <IssuesTable occurrence={occurrence} />
      <OccurrenceTable occurrence={occurrence} />
    </>
  ) : (
    loadingGif
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
      <BrokerTable columns={1}>
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

export function SpecifyNetworkSpecies({
  species,
}: {
  readonly species: RA<BrokerRecord> | undefined;
}): JSX.Element {
  return species === undefined ? (
    loadingGif
  ) : (
    <SpecifyNetworkResponse responses={species} />
  );
}
