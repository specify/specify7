import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { ajax } from '../../utils/ajax';
import { Button } from '../Atoms/Button';
import { collectionPreferences } from '../Preferences/collectionPreferences';
import { RetrieveGbifKey } from './Setup';
import { commonText } from '../../localization/common';

export function SpecifyNetworkCollection(): JSX.Element | null {
  const [key] = collectionPreferences.use(
    'statistics',
    'specifyNetwork',
    'publishingOrganization'
  );
  return key === undefined ? <RetrieveGbifKey /> : <Organization />;
}

function Organization(): JSX.Element | null {
  const [key, setKey] = collectionPreferences.use(
    'statistics',
    'specifyNetwork',
    'publishingOrganization'
  );
  const [organizationTitle] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<{
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
      <header>
        {organizationTitle}
        <Button.Icon
          icon="backspace"
          title={commonText.change()}
          onClick={(): void => setKey(undefined)}
        />
      </header>
      <DataSets />
    </>
  );
}

function DataSets(): JSX.Element | null {}
