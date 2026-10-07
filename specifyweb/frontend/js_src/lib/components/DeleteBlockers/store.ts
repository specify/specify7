import { PromiseQueue } from '../../utils/promiseQueue';
import { filterArray, RA } from '../../utils/types';
import { DEFAULT_FETCH_LIMIT } from '../DataModel/collection';
import { AnySchema } from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { getTable } from '../DataModel/tables';
import { Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import {
  fetchInitialBlockers,
  filterDeleteBlockers,
  groupBlockers,
} from './deleteBlockers';
import { blockerPageToCacheKey, DeleteBlockerLRU } from './pageCache';
import {
  APIDeleteBlockerPage,
  APIDeleteBlockers,
  BlockerPageCacheKey,
} from './types';

function recordToBlockerCacheKey(
  resource: SpecifyResource<AnySchema>,
  relationshipInfo?: {
    readonly relatedTable: string;
    readonly relationshipName: string;
  },
  anchorId: number = 0
): BlockerPageCacheKey {
  const tableName = resource.specifyTable.name.toLowerCase();
  const recordId = resource.id;
  if (recordId === undefined) {
    softFail('Attempting to get DeleteBlockers for record without ID');
  }
  const relationshipTable = relationshipInfo?.relatedTable.toLowerCase();
  const relationshipName = relationshipInfo?.relationshipName.toLowerCase();
  const keyParts = filterArray([
    tableName,
    recordId,
    relationshipTable,
    relationshipName,
    anchorId,
  ]);
  return keyParts.join('_');
}

type DeleteBlockerRecord = {
  readonly table: Lowercase<keyof Tables>;
  readonly count?: number;
  readonly relationships: RA<{
    readonly name: string;
    readonly count?: number;
  }>;
};

type DeleteBlockerRecords = {
  readonly resource: SpecifyResource<AnySchema>;
  readonly count?: number;
  readonly records: RA<DeleteBlockerRecord>;
};

// eslint-disable-next-line functional/no-class
export class DeleteBlockerStore {
  private readonly pageCache: DeleteBlockerLRU;
  private readonly countPromiseQueue: PromiseQueue<string, unknown>;
  private readonly pagePromiseQueue: PromiseQueue<BlockerPageCacheKey, unknown>;
  private readonly records: Map<string, DeleteBlockerRecords>;
  private readonly recordsPerPage: number;

  public constructor({
    maxPages = 400,
    recordsPerPage = DEFAULT_FETCH_LIMIT,
  }: {
    readonly recordsPerPage?: number;
    readonly maxPages?: number;
  }) {
    this.recordsPerPage = recordsPerPage;
    this.pageCache = new DeleteBlockerLRU({ maxPages });
    // We only allow one promise to be resolving at a time for counts, and
    // three for pages.
    // This should still let the browser handle other requests while fetching
    // blocker information for records with a lot of references
    this.countPromiseQueue = new PromiseQueue(1);
    this.pagePromiseQueue = new PromiseQueue(3);
    this.records = new Map();
  }

  public async seedBlockers(resource: SpecifyResource<AnySchema>) {
    const queueKey = recordToBlockerCacheKey(resource);
    const promiseInQueue = this.pagePromiseQueue.get(queueKey);
    if (promiseInQueue === false || promiseInQueue !== undefined) {
      return;
    }
    this.pagePromiseQueue.enqueue(queueKey, () =>
      this.handleMainBlockers(resource)
    );
  }

  private async handleMainBlockers(resource: SpecifyResource<AnySchema>) {
    const blockerResponse = await fetchInitialBlockers(
      resource.specifyTable.name,
      resource.id,
      this.recordsPerPage
    );
    this.handleDeleteBlockerPage(resource, blockerResponse);
  }

  private handleDeleteBlockerPage(
    resource: SpecifyResource<AnySchema>,
    blockers: APIDeleteBlockers
  ) {
    const { results, next } = blockers;
    this.pageCache.cachePages(resource, results);
    this.records.set(this.resourceToStringIdentifier(resource), {
      resource,
      records: groupBlockers(results).map((group) => ({
        table: group.table,
        relationships: group.blockers.map((blocker) => ({
          name: blocker.field,
        })),
      })),
    });
    this.queueNextBlockers(resource, next);
  }

  // FIXME: add count support
  public async queueBlockerCounts(resource: SpecifyResource<AnySchema>) {
    const countKey = this.resourceToStringIdentifier(resource);
    const alreadyQueued = this.countPromiseQueue.get(countKey);
    if (alreadyQueued === false) {
      return false;
    }
    if (alreadyQueued !== undefined) {
      return undefined;
    }
  }

  private resourceToStringIdentifier(resource: SpecifyResource<AnySchema>) {
    const keyParts = [resource.specifyTable.name.toLowerCase(), resource.id];
    return keyParts.join('_');
  }

  private async queueNextBlockers(
    resource: SpecifyResource<AnySchema>,
    nextBlockers: RA<APIDeleteBlockerPage>
  ) {
    nextBlockers.forEach((nextBlocker) => {
      this.queueNextBlocker(resource, nextBlocker);
    });
  }

  private pageIsFetching(key: BlockerPageCacheKey): boolean {
    const isCurrentlyFetching = this.pagePromiseQueue.get(key);
    return isCurrentlyFetching !== false && isCurrentlyFetching !== undefined;
  }

  private pageIsCached(key: BlockerPageCacheKey): boolean {
    const isCached = this.pageCache.getPage(key);
    return isCached !== undefined;
  }

  private async queueNextBlocker(
    resource: SpecifyResource<AnySchema>,
    nextBlocker: APIDeleteBlockerPage
  ) {
    const cacheKey = blockerPageToCacheKey(resource, nextBlocker);
    if (this.pageIsCached(cacheKey) || this.pageIsFetching(cacheKey)) {
      return;
    }
    const table = getTable(nextBlocker.table);
    if (table === undefined) {
      softFail('Unknown table for Delete Blocker');
      return;
    }
    for (const id of nextBlocker.ids) {
      const resource = new table.Resource({ id }, { noBusinessRules: true });
      this.seedBlockers(resource);
    }
    // We need to handle queuing up the rest of the next blockers
    if (nextBlocker.complete === false) {
      this.handleNextPage(resource, nextBlocker);
    }
  }

  public async filterBlockers(
    resource: SpecifyResource<AnySchema>,
    relatedTable: keyof Tables | Lowercase<keyof Tables>,
    relationshipName: string,
    anchor: number | undefined = undefined
  ) {
    const cacheKey = recordToBlockerCacheKey(resource, {
      relatedTable,
      relationshipName,
    });
    if (this.pageIsFetching(cacheKey)) {
      return;
    }
    const fetchBlockers = () =>
      filterDeleteBlockers(resource.specifyTable.name, resource.id, [
        {
          table: relatedTable,
          field: relationshipName,
          anchor,
          limit: this.recordsPerPage,
        },
      ]).then((blockers) => this.handleDeleteBlockerPage(resource, blockers));
    this.pagePromiseQueue.enqueue(cacheKey, fetchBlockers);
  }

  private async handleNextPage(
    resource: SpecifyResource<AnySchema>,
    blockerPage: APIDeleteBlockerPage
  ) {
    if (blockerPage.complete) {
      // The page we're requesting the next page from is already complete.
      // Skip the request
      return;
    }
    const newAnchor = blockerPage.ids.at(-1);

    if (newAnchor === undefined) {
      // A blocker page with no IDs should be considered complete
      softFail('Empty blocker with no IDs not marked complete');
      return;
    }
    const newPage = {
      ...blockerPage,
      anchor: newAnchor,
    };
    const cacheKey = blockerPageToCacheKey(resource, newPage);
    if (this.pageIsFetching(cacheKey)) {
      return;
    }
    this.filterBlockers(resource, newPage.table, newPage.field, newAnchor);
  }
}
