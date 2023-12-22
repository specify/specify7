import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { specifyNetworkText } from '../../localization/specifyNetwork';
import { ajax } from '../../utils/ajax';
import { localized } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Container } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Label, Select } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { tables } from '../DataModel/tables';
import { loadingGif } from '../Molecules';
import { collectionPreferences } from '../Preferences/collectionPreferences';
import { formatUrl } from '../Router/queryString';
import { GbifMap } from './Map';
import { paginateGbif, RetrieveGbifKey } from './Setup';

export function SpecifyNetworkCollection(): JSX.Element | null {
  const [key] = collectionPreferences.use(
    'statistics',
    'specifyNetwork',
    'publishingOrganization'
  );
  return (
    <Container.Full className="gap-8">
      {key === undefined ? <RetrieveGbifKey /> : <Institution />}
    </Container.Full>
  );
}

function Institution(): JSX.Element | null {
  const [key, setKey] = collectionPreferences.use(
    'statistics',
    'specifyNetwork',
    'publishingOrganization'
  );
  const [organizationTitle] = useAsyncState(
    React.useCallback(
      async () =>
        key === undefined
          ? undefined
          : ajax<{
              readonly title: LocalizedString;
            }>(`https://api.gbif.org/v1/organization/${key}`, {
              headers: {
                Accept: 'application/json',
              },
            }).then(({ data }) => data.title),
      [key]
    ),
    true
  );
  const mapData = React.useMemo(
    () => (key === undefined ? undefined : { publishingOrg: key }),
    [key]
  );
  return organizationTitle === undefined ||
    key === undefined ||
    mapData === undefined ? null : (
    <>
      <section className="flex flex-col gap-2">
        <header className="flex items-center gap-2">
          <h3 className={className.headerPrimary}>{organizationTitle}</h3>
          <Link.NewTab href={`https://www.gbif.org/publisher/${key}`} />
          <Button.Icon
            icon="backspace"
            title={commonText.change()}
            onClick={(): void => setKey(undefined)}
          />
        </header>
        <p>{specifyNetworkText.institutionDistributionMap()}</p>
        <GbifMap mapData={mapData} />
      </section>
      <Collections institutionKey={key} />
    </>
  );
}

function Collections({
  institutionKey: key,
}: {
  readonly institutionKey: string;
}): JSX.Element | null {
  /*
   * FEATURE: add a way to detect that GBIF has no computed map for a collection
   *  and display a message to that effect
   */
  const [collections] = useAsyncState(
    React.useCallback(
      async () =>
        paginateGbif(
          formatUrl(`https://api.gbif.org/v1/dataset/search/`, {
            publishingOrg: key,
          })
        ).then((results) =>
          results
            .map(({ title, key }) => ({
              title: localized(title as string),
              key: key as string,
            }))
            .sort(sortFunction(({ title }) => title))
        ),
      [key]
    ),
    false
  );

  const [collection = collections?.[0].key, setCollection] =
    collectionPreferences.use('statistics', 'specifyNetwork', 'collectionKey');

  const mapData = React.useMemo(
    () =>
      collection === undefined || collection.length === 0
        ? undefined
        : {
            datasetKey: collection,
          },
    [collection]
  );

  return collections === undefined ? (
    loadingGif
  ) : (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <Label.Inline>
          <span className={className.headerPrimary}>
            {tables.Collection.label}
          </span>
          <Select value={collection} onValueChange={setCollection}>
            <option />
            {collections.map(({ title, key }) => (
              <option key={key} value={key}>
                {title}
              </option>
            ))}
          </Select>
        </Label.Inline>
        {typeof collection === 'string' && (
          <Link.NewTab href={`https://www.gbif.org/dataset/${collection}`} />
        )}
      </div>
      {typeof mapData === 'object' && (
        <>
          <p>{specifyNetworkText.collectionDistributionMap()}</p>
          <GbifMap mapData={mapData} />
        </>
      )}
    </section>
  );
}
