import React from 'react';

import { commonText } from '../../localization/common';
import { specifyNetworkText } from '../../localization/specifyNetwork';
import type { IR, RA } from '../../utils/types';
import { tables } from '../DataModel/tables';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { BrokerRow, BrokerSection, BrokerTable } from './Components';
import type { BrokerRecord } from './fetchers';
import { extractBrokerField } from './fetchers';
import type { BrokerData } from './Overlay';
import { NoBrokerData } from './Overlay';
import { SpecifyNetworkResponse } from './Response';

export function SpecifyNetworkOccurrence({
  data: { occurrence },
  onClose: handleClose,
}: {
  readonly data: BrokerData;
  readonly onClose: () => void;
}): JSX.Element {
  return typeof occurrence === 'object' ? (
    occurrence.length === 0 ? (
      <NoBrokerData onClose={handleClose} />
    ) : (
      <Dialog
        buttons={commonText.close()}
        header={tables.CollectionObject.label}
        modal={false}
        onClose={handleClose}
      >
        <IssuesTable occurrence={occurrence} />
        <OccurrenceTable occurrence={occurrence} />
      </Dialog>
    )
  ) : (
    <LoadingScreen />
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
    <BrokerSection label={specifyNetworkText.dataQuality()}>
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
    extractBrokerField(occurrence, 'mopho', 's2n:view_url', true);

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
    <BrokerSection label={tables.CollectionObject.label}>
      <SpecifyNetworkResponse responses={alteredResponse} />
    </BrokerSection>
  );
}

export function SpecifyNetworkSpecies({
  data: { species, speciesName },
  onClose: handleClose,
}: {
  readonly data: BrokerData;
  readonly onClose: () => void;
}): JSX.Element {
  return species === undefined ? (
    <LoadingScreen />
  ) : species.length === 0 ? (
    <NoBrokerData onClose={handleClose} />
  ) : (
    <Dialog
      buttons={commonText.close()}
      header={speciesName ?? tables.Taxon.label}
      modal={false}
      onClose={handleClose}
    >
      <SpecifyNetworkResponse responses={species} />
    </Dialog>
  );
}
