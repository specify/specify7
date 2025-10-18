import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { formatUrl } from '../Router/queryString';
import { contextUnlockedPromise, foreverFetch } from '../InitialContext';
import { type PartialPreferences } from './BasePreferences';
import { globalPreferenceDefinitions } from './GlobalDefinitions';
import { globalPreferences } from './globalPreferences';
import { parseGlobalPreferences } from './globalPreferencesUtils';

export const loadGlobalPreferences = async (): Promise<void> => {
  const entryPoint = await contextUnlockedPromise;
  if (entryPoint !== 'main') {
    await foreverFetch();
    return;
  }

  const { data, status } = await ajax<string>(
    formatUrl('/context/app.resource', {
      name: 'GlobalPreferences',
      quiet: '',
    }),
    {
      headers: { Accept: 'text/plain' },
      expectedErrors: [Http.NO_CONTENT],
      errorMode: 'visible',
    }
  );

  const { raw } = parseGlobalPreferences(
    status === Http.NO_CONTENT ? null : data
  );

  globalPreferences.setRaw(
    raw as PartialPreferences<typeof globalPreferenceDefinitions>
  );
};
