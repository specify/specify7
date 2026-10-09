import { LRUCache } from '../../utils/lruCache';
import { RA } from '../../utils/types';
import { AnySchema } from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { APIDeleteBlockerPage } from './deleteBlockers';
import { ResourceIdentifier } from './state';

export type BlockerPageCacheKey = string;

export type DeleteBlockerLRUPage = {
  readonly ownerTable: string;
  readonly ownerId: number;
  readonly table: Lowercase<keyof Tables>;
  readonly ids: RA<number>;
  readonly anchor: 'last' | number | null;
  readonly backwards: boolean;
  readonly complete: boolean;
};

export function pageAnchorToFilter(anchor: number | null | 'last') {
  return anchor === undefined || anchor === 'last' ? null : anchor;
}

export function makeBlockerKey(...components: RA<unknown>) {
  return components.join('_');
}

export function buildPageCacheKey(
  owner: SpecifyResource<AnySchema>,
  relatedTable?: string,
  relationshipName?: string,
  anchor: number | null | 'last' = null
) {
  const ownerTable = owner.specifyTable.name.toLowerCase();
  const ownerId = owner.id;
  if (ownerId === undefined) {
    softFail('Attempting to get DeleteBlockers for record without ID');
  }
  const keyParts = [
    ownerTable,
    ownerId,
    relatedTable?.toLowerCase(),
    relationshipName?.toLowerCase(),
    anchor,
  ];
  return makeBlockerKey(...keyParts);
}

export function blockerPageToCacheKey(
  owner: SpecifyResource<AnySchema>,
  page: APIDeleteBlockerPage
): BlockerPageCacheKey {
  const tableName = page.table;
  const relationshipName = page.field;
  const backwards = page.backwards;
  const anchorId = page.anchor;
  const resolvedAnchor = anchorId === null && backwards ? 'last' : anchorId;
  return buildPageCacheKey(owner, tableName, relationshipName, resolvedAnchor);
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
      ownerTable: resource.specifyTable.name.toLowerCase(),
      ownerId: resource.id,
      ids: blockerPage.ids,
      table: blockerPage.table,
      anchor: blockerPage.anchor,
      backwards: blockerPage.backwards,
      complete: blockerPage.complete,
    };
    this.pageCache.set(cacheKey, cachedPage);
    return cachedPage;
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

  // Given a specific resource identifier (table + id), this removes all pages
  // owned by that resource
  public removePagesOwnedBy(identifer: ResourceIdentifier) {
    for (const [cacheKey, page] of this.pageCache.entries()) {
    }
  }

  public clear() {
    return this.pageCache.clear();
  }
}
