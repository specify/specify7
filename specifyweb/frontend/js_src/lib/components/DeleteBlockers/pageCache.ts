import { LRUCache } from '../../utils/lrucache';
import { RA } from '../../utils/types';
import { AnySchema } from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { softFail } from '../Errors/Crash';
import { APIDeleteBlockerPage, BlockerPageCacheKey } from './types';

type DeleteBlockerLRUPage = RA<number>;

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
  public constructor({ maxPages = 200 }: { readonly maxPages?: number }) {
    this.pageCache = new LRUCache({ maxSize: maxPages });
  }

  public cachePages(
    resource: SpecifyResource<AnySchema>,
    blockerPages: RA<APIDeleteBlockerPage>
  ) {
    blockerPages.forEach((page) => this.cachePage(resource, page));
  }

  private cachePage(
    resource: SpecifyResource<AnySchema>,
    blockerPage: APIDeleteBlockerPage
  ) {
    const cacheKey = blockerPageToCacheKey(resource, blockerPage);
    this.pageCache.set(cacheKey, blockerPage.ids);
  }

  public getPage(
    cacheKey: BlockerPageCacheKey
  ): DeleteBlockerLRUPage | undefined {
    return this.pageCache.get(cacheKey);
  }
}
