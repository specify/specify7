import { ping } from '../../utils/ajax/ping';
import { softFail } from '../Errors/Crash';
import { formatUrl } from '../Router/queryString';
import { load } from './index';
import { fetchContext as fetchSystemInfo } from './systemInfo';

type StatsCounts = {
  readonly Collectionobject: number;
  readonly Collection: number;
  readonly Specifyuser: number;
};

const stats2RequestIntervalMs = 24 * 60 * 60 * 1000;
const stats2RequestKeyPrefix = 'specify7-stats2-last-request';
const stats2RequestTimeoutMs = 5_000;

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

function buildStats2RequestKey(lambdaUrl: string, collectionGuid: string): string {
  return `${stats2RequestKeyPrefix}:${collectionGuid}:${lambdaUrl}`;
}

function shouldSendStats2Request(storageKey: string, now = Date.now()): boolean {
  if (globalThis.localStorage === undefined) return true;

  try {
    const previousRequestAt = globalThis.localStorage.getItem(storageKey);
    if (previousRequestAt === null) return true;
    const parsed = Number(previousRequestAt);
    if (!Number.isFinite(parsed)) return true;
    if (parsed > now) return true;
    return now - parsed >= stats2RequestIntervalMs;
  } catch {
    return true;
  }
}

function recordStats2Request(storageKey: string, now = Date.now()): void {
  if (globalThis.localStorage === undefined) return;

  try {
    globalThis.localStorage.setItem(storageKey, `${now}`);
  } catch {}
}

function pingInBackground(url: string): void {
  const controller =
    typeof globalThis.AbortController === 'function'
      ? new globalThis.AbortController()
      : undefined;
  const timeoutId =
    controller === undefined
      ? undefined
      : globalThis.setTimeout(() => controller.abort(), stats2RequestTimeoutMs);

  void ping(url, {
    errorMode: 'silent',
    ...(controller === undefined ? {} : { signal: controller.signal }),
  })
    .catch(softFail)
    .finally(() => {
      if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId);
    });
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
    const storageKey = buildStats2RequestKey(
      lambdaUrl,
      `${systemInfo.collection_guid}`
    );
    if (!shouldSendStats2Request(storageKey)) {
      return;
    }
    recordStats2Request(storageKey);
    pingInBackground(formatUrl(lambdaUrl, parameters, false));
  }
});

export const exportsForTests = {
  buildStats2RequestKey,
  shouldSendStats2Request,
  recordStats2Request,
};
