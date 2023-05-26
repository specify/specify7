import React from 'react';

import type { RA } from '../../utils/types';
import { Link } from '../Atoms/Link';
import { BrokerRow, BrokerTable } from './Components';
import type { BrokerRecord } from './fetchers';
import { mapBrokerFields } from './FieldMapper';
import { getBrokerKeys, getValue } from './responseToTable';
import { reorderBrokerFields } from './utils';

export function SpecifyNetworkResponse({
  responses,
}: {
  readonly responses: RA<BrokerRecord>;
}): JSX.Element | null {
  return responses.length === 0 ? null : (
    <BrokerTable
      columns={responses.length}
      header={
        <>
          <td />
          {responses.map(({ provider, record }) => (
            <th className="justify-center" key={provider.code} scope="col">
              <img
                alt=""
                className="h-table-icon w-table-icon"
                src={provider.icon_url}
              />
              {typeof record['s2n:view_url'] === 'string' ? (
                <Link.NewTab href={record['s2n:view_url']}>
                  {provider.label}
                </Link.NewTab>
              ) : (
                provider.label
              )}
            </th>
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
          cellClassName={
            new Set(
              originalCells
                .filter(Boolean)
                .map((value) => JSON.stringify(value))
            ).size === 1
              ? undefined
              : 'text-red-500'
          }
          cells={cells}
          header={label}
          key={label}
          title={title}
        />
      ))}
    </BrokerTable>
  );
}
