import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { ajax } from '../../utils/ajax';
import { Container } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Label, Select } from '../Atoms/Form';
import { schema } from '../DataModel/schema';
import { collectionPreferences } from '../Preferences/collectionPreferences';
import { formatUrl } from '../Router/queryString';
import { paginateGbif, RetrieveGbifKey } from './Setup';

export function SpecifyNetworkCollection(): JSX.Element | null {
  const [key] = collectionPreferences.use(
    'statistics',
    'specifyNetwork',
    'publishingOrganization'
  );
  return (
    <Container.Full>
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
  return organizationTitle === undefined || key === undefined ? null : (
    <>
      <header className="flex items-center gap-2">
        <h3 className={className.headerPrimary}>{organizationTitle}</h3>
        <Button.Icon
          icon="backspace"
          title={commonText.change()}
          onClick={(): void => setKey(undefined)}
        />
      </header>
      <Collections institutionKey={key} />
    </>
  );
}

function Collections({
  institutionKey: key,
}: {
  readonly institutionKey: string;
}): JSX.Element | null {
  const [collections] = useAsyncState(
    React.useCallback(
      async () =>
        paginateGbif(
          formatUrl(`https://api.gbif.org/v1/dataset/search/`, {
            publishingOrg: key,
          })
        ).then((results) =>
          results.map(({ title, key }) => ({
            title: title as LocalizedString,
            key: key as string,
          }))
        ),
      [key]
    ),
    true
  );

  const [collection, setCollection] = useCachedState(
    'specifyNetwork',
    'lastDatSetKey'
  );

  return collections === undefined ? null : (
    <Label.Inline>
      {schema.models.Collection.label}
      <Select value={collection} onValueChange={setCollection}>
        {collections.map(({ title, key }) => (
          <option key={key} value={key}>
            {title}
          </option>
        ))}
      </Select>
    </Label.Inline>
  );
}
