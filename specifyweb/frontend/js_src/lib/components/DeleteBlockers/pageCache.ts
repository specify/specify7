import { LRUCache } from '../../utils/lruCache';
import { RA } from '../../utils/types';
import { AnySchema } from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { APIDeleteBlockerPage, BlockerPageCacheKey } from './types';

export type DeleteBlockerLRUPage = {
  readonly table: Lowercase<keyof Tables>;
  readonly ids: RA<number>;
};

export function blockerPageToCacheKey(
  owner: SpecifyResource<AnySchema>,
  page: APIDeleteBlockerPage
): BlockerPageCacheKey {
  const ownerTable = owner.specifyTable.name.toLowerCase();
  const ownerId = owner.id;
  if (ownerId === undefined) {
    softFail('Attempting to get DeleteBlockers for record without ID');
  }
  const tableName = page.table;
  const relationshipName = page.field;
  const anchorId = page.anchor ?? 0;
  const keyParts = [ownerTable, ownerId, tableName, relationshipName, anchorId];
  return keyParts.join('_');
}

// eslint-disable-next-line functional/no-class
export class DeleteBlockerLRU {
  private readonly pageCache: LRUCache<
    BlockerPageCacheKey,
    DeleteBlockerLRUPage
  >;
  public constructor({
    maxPages = 200,
    onEvict = undefined,
  }: {
    readonly maxPages?: number;
    readonly onEvict?: (
      key: BlockerPageCacheKey,
      page: DeleteBlockerLRUPage
    ) => void;
  }) {
    this.pageCache = new LRUCache({ maxSize: maxPages, onEvict });
  }

  public cachePages(
    resource: SpecifyResource<AnySchema>,
    blockerPages: RA<APIDeleteBlockerPage>
  ) {
    blockerPages.forEach((page) => this.cachePage(resource, page));
  }

  public cachePage(
    resource: SpecifyResource<AnySchema>,
    blockerPage: APIDeleteBlockerPage
  ) {
    const cacheKey = blockerPageToCacheKey(resource, blockerPage);
    const cachedPage: DeleteBlockerLRUPage = {
      ids: blockerPage.ids,
      table: blockerPage.table,
    };
    this.pageCache.set(cacheKey, cachedPage);
  }

  public getPage(
    cacheKey: BlockerPageCacheKey
  ): DeleteBlockerLRUPage | undefined {
    return this.pageCache.get(cacheKey);
  }

  public peekPage(
    cacheKey: BlockerPageCacheKey
  ): DeleteBlockerLRUPage | undefined {
    return this.pageCache.peek(cacheKey);
  }

  public clear() {
    return this.pageCache.clear();
  }
}
