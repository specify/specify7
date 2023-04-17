import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { specifyNetworkText } from '../../localization/specifyNetwork';
import { ajax } from '../../utils/ajax';
import type { IR, RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { getDomainResource } from '../DataModel/domain';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Institution } from '../DataModel/types';
import { loadingGif } from '../Molecules';
import { collectionPreferences } from '../Preferences/collectionPreferences';
import { formatUrl } from '../Router/queryString';
import { LocalizedString } from 'typesafe-i18n';

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
      <H3>{specifyNetworkText.connectToGbif()}</H3>
      <Input.Text value={searchQuery} onValueChange={setSearchQuery} />
      {results === undefined ? (
        loadingGif
      ) : (
        <Ul className="flex flex-col gap-2">
          {results.map(({ title, key }) => (
            <li key={key} className="flex gap-2">
              <Button.LikeLink onClick={(): void => setOrganizationKey(key)}>
                {title}
              </Button.LikeLink>
              <Link.NewTab href={`https://www.gbif.org/publisher/${key}`} />
            </li>
          ))}
        </Ul>
      )}
    </>
  );
}

const fetchPossibleInstitutions = async (
  query: string,
  offset: number = 0
): Promise<
  RA<{
    readonly title: LocalizedString;
    readonly key: string;
  }>
> =>
  ajax<{
    readonly limit: number;
    readonly count: number;
    readonly results: RA<IR<unknown>>;
  }>(
    formatUrl('https://api.gbif.org/v1/organization/', {
      q: query,
      offset: offset.toString(),
    }),
    {
      headers: {
        Accept: 'application/json',
      },
    }
  ).then(async ({ data: { results, limit, count } }) => [
    ...results.map(({ title, key }) => ({
      title: title as LocalizedString,
      key: key as string,
    })),
    ...(count < limit + offset
      ? await fetchPossibleInstitutions(query, offset + limit)
      : []),
  ]);
