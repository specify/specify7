import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { specifyNetworkText } from '../../localization/specifyNetwork';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import type { IR, RA } from '../../utils/types';
import { defined, localized } from '../../utils/types';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input, Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getDomainResource } from '../DataModel/scoping';
import type { Institution } from '../DataModel/types';
import { loadingGif } from '../Molecules';
import { collectionPreferences } from '../Preferences/collectionPreferences';
import { formatUrl } from '../Router/queryString';

export function RetrieveGbifKey(): JSX.Element | null {
  const [institution] = useAsyncState(fetchInstitution, true);
  return institution === undefined ? null : (
    <PickInstitution institution={institution} />
  );
}

const fetchInstitution = async (): Promise<SpecifyResource<Institution>> =>
  defined(
    getDomainResource('institution'),
    'Unable to retrieve institution'
  ).fetch();

function PickInstitution({
  institution,
}: {
  readonly institution: SpecifyResource<Institution>;
}): JSX.Element {
  // FIXME: store in in institutional prferences instead
  const [, setOrganizationKey] = collectionPreferences.use(
    'statistics',
    'specifyNetwork',
    'publishingOrganization'
  );
  const [searchQuery, setSearchQuery] = React.useState(
    institution.get('name') ?? ''
  );
  const [results] = useAsyncState(
    React.useCallback(
      async () => fetchPossibleInstitutions(searchQuery),
      [searchQuery]
    ),
    false
  );
  return (
    <>
      <h2 className={className.headerPrimary}>
        {specifyNetworkText.connectToGbif()}
      </h2>
      <Label.Block>
        {specifyNetworkText.searchForInstitution()}
        <Input.Text value={searchQuery} onValueChange={setSearchQuery} />
      </Label.Block>
      {results === undefined ? (
        loadingGif
      ) : (
        <div>
          <p>{`${wbText.searchResults()}:`}</p>
          <Ul className="flex flex-col gap-2">
            {results.map(({ title, key }) => (
              <li className="flex gap-2" key={key}>
                <Button.LikeLink onClick={(): void => setOrganizationKey(key)}>
                  {title}
                </Button.LikeLink>
                <Link.NewTab href={`https://www.gbif.org/publisher/${key}`} />
              </li>
            ))}
          </Ul>
        </div>
      )}
    </>
  );
}

const fetchPossibleInstitutions = async (
  query: string
): Promise<
  RA<{
    readonly title: LocalizedString;
    readonly key: string;
  }>
> =>
  paginateGbif(
    formatUrl('https://api.gbif.org/v1/organization/', {
      q: query,
    })
  ).then((results) =>
    results.map(({ title, key }) => ({
      title: localized(title as string),
      key: key as string,
    }))
  );

export const paginateGbif = async (
  url: string,
  offset: number = 0
): Promise<RA<IR<unknown>>> =>
  ajax<{
    readonly limit: number;
    readonly count: number;
    readonly results: RA<IR<unknown>>;
  }>(
    formatUrl(url, {
      offset: offset.toString(),
    }),
    {
      headers: {
        Accept: 'application/json',
      },
    }
  ).then(async ({ data: { results, limit, count } }) => [
    ...results,
    ...(count > limit + offset ? await paginateGbif(url, offset + limit) : []),
  ]);
