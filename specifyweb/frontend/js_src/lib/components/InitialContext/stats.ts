import { fetchContext as fetchSystemInfo } from './systemInfo';
import { ping } from '../../utils/ajax/ping';
import { softFail } from '../Errors/Crash';
import { formatUrl } from '../Router/queryString';
import { load } from './index';

type StatsCounts = {
  readonly Collectionobject: number;
  readonly Collection: number;
  readonly Specifyuser: number;
};

function buildStatsLambdaUrl(base: string | null | undefined): string | null {
  if (!base) return null;
  let u = base.trim();

  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;

  const hasRoute = /\/(prod|default)\/[^\s/]+/.test(u);
  if (!hasRoute) {
    const stage = 'prod';
    const route = 'AggrgatedSp7Stats';
    u = `${u.replace(/\/$/, '')}/${stage}/${route}`;
  }
  return u;
}

export const fetchContext = fetchSystemInfo.then(async (systemInfo) => {
  if (systemInfo === undefined) {
    return;
  }
  if (systemInfo.stats_url === null && systemInfo.stats_2_url === null) {
    return;
  }
  let counts: StatsCounts | null = null;
  try {
    counts = await load<StatsCounts>(
      '/context/stats_counts.json',
      'application/json'
    );
  } catch {
    // If counts fetch fails, proceed without them.
    counts = null;
  }

  const parameters = {
    version: systemInfo.version,
    dbVersion: systemInfo.database_version,
    institution: systemInfo.institution,
    institutionGUID: systemInfo.institution_guid,
    discipline: systemInfo.discipline,
    collection: systemInfo.collection,
    collectionGUID: systemInfo.collection_guid,
    isaNumber: systemInfo.isa_number,
    disciplineType: systemInfo.discipline_type,
    collectionObjectCount: counts?.Collectionobject ?? 0,
    collectionCount: counts?.Collection ?? 0,
    userCount: counts?.Specifyuser ?? 0,
  };
  if (systemInfo.stats_url)
    await ping(
      formatUrl(
        systemInfo.stats_url,
        parameters,
        /*
         * I don't know if the receiving server handles GET parameters in a
         * case-sensitive way. Thus, don't convert keys to lower case, but leave
         * them as they were sent in previous versions of Specify 7
         */
        false
      ),
      { errorMode: 'silent' }
    ).catch(softFail);

  const lambdaUrl = buildStatsLambdaUrl(systemInfo.stats_2_url);
  if (lambdaUrl) {
    await ping(formatUrl(lambdaUrl, parameters, false), {
      errorMode: 'silent',
    }).catch(softFail);
  }
});
