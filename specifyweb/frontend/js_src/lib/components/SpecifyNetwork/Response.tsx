import React from 'react';

import type { RA } from '../../utils/types';
import { BrokerRow, BrokerTable } from './Components';
import { occurrenceDataProviders, speciesDataProviders } from './config';
import type { BrokerRecord } from './fetchers';
import { mapBrokerFields } from './FieldMapper';
import { getBrokerKeys, getValue } from './responseToTable';
import { reorderBrokerFields } from './utils';

const minColumns = Math.min(
  occurrenceDataProviders.length,
  speciesDataProviders.length
);

export function SpecifyNetworkResponse({
  responses,
}: {
  readonly responses: RA<BrokerRecord>;
}): JSX.Element | null {
  const blankColumns = Math.max(0, minColumns - responses.length);
  return responses.length === 0 ? null : (
    <BrokerTable
      className="data"
      header={
        <>
          <td />
          {responses.map(({ provider, record }) => (
            <th key={provider.code} scope="col">
              <div>
                <img alt="" src={`${provider.icon_url}&icon_status=active`} />
                <span>
                  {provider.label}{' '}
                  {typeof record['s2n:view_url'] === 'string' ? (
                    <a
                      href={record['s2n:view_url']}
                      rel="noreferrer"
                      target="_blank"
                    >
                      (link)
                    </a>
                  ) : (
                    ''
                  )}
                </span>
              </div>
            </th>
          ))}
          {Array.from({ length: blankColumns }, (_, index) => (
            <th key={index} scope="col" />
          ))}
        </>
      }
    >
      {mapBrokerFields(
        reorderBrokerFields(
          Object.fromEntries(
            getBrokerKeys(responses.map((response) => response.record)).map(
              (key) =>
                [
                  key,
                  responses.map((response) => getValue(response, key)),
                ] as const
            )
          )
        )
      ).map(({ label, title, originalCells, cells }) => (
        <BrokerRow
          cells={[...cells, ...Array.from({ length: blankColumns }, () => '')]}
          className={
            new Set(
              originalCells
                .filter(Boolean)
                .map((value) => JSON.stringify(value))
            ).size === 1
              ? 'identical'
              : ''
          }
          header={label}
          key={label}
          title={title}
        />
      ))}
    </BrokerTable>
  );
}
