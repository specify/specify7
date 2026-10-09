import { PromiseQueue } from '../../utils/promiseQueue';
import { RA, WritableArray } from '../../utils/types';
import { AnySchema } from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { getTable } from '../DataModel/tables';
import { Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import {
  APIDeleteBlockerCount,
  APIDeleteBlockerCounts,
  DELETE_BLOCKER_LIMIT,
  fetchInitialBlockers,
  fetchReferenceCounts,
  filterDeleteBlockers,
} from './deleteBlockers';
import {
  BlockerPageCacheKey,
  blockerPageToCacheKey,
  buildPageCacheKey,
  DeleteBlockerLRU,
  DeleteBlockerLRUPage,
  makeBlockerKey,
  pageAnchorToFilter,
} from './pageCache';
import { APIDeleteBlockerPage, APIDeleteBlockers } from './deleteBlockers';
import { f } from '../../utils/functools';

export type ResourceIdentifier = string;

export type BlockerRelationship = {
  readonly key: BlockerPageCacheKey;
  readonly table: Lowercase<keyof Tables>;
  readonly field: string;
  // eslint-disable-next-line functional/prefer-readonly-type
  count?: number;
};

export type BlockerNode = {
  readonly key: ResourceIdentifier;
  readonly resource: SpecifyResource<AnySchema>;
  readonly relationshipMetaData: Map<string, BlockerRelationship>;
  readonly cascadeChildren: Set<string>;
  // eslint-disable-next-line functional/prefer-readonly-type
  count?: number;
  // eslint-disable-next-line functional/prefer-readonly-type
  version: number;
};

export function resourceToStringIdentifier(
  resource: SpecifyResource<AnySchema>
): ResourceIdentifier {
  return makeBlockerKey(resource.specifyTable.name.toLowerCase(), resource.id);
}

function identifierToParts(
  resourceKey: ResourceIdentifier
): readonly [Lowercase<keyof Tables>, number] {
  const [tableName, recordId] = resourceKey.split('_', 2);
  return [
    tableName.toLowerCase() as Lowercase<keyof Tables>,
    f.fastParseInt(recordId),
  ];
}

// eslint-disable-next-line functional/no-class
export class DeleteBlockerState {
  private readonly pageCache: DeleteBlockerLRU;
  private readonly countPromiseQueue: PromiseQueue<string, unknown>;
  private readonly pagePromiseQueue: PromiseQueue<
    BlockerPageCacheKey,
    RA<DeleteBlockerLRUPage>
  >;
  private readonly nodes: Map<string, BlockerNode>;
  private readonly cascadeParents: Map<string, Set<string>>;
  private readonly recordLocations: Map<
    ResourceIdentifier,
    Set<BlockerPageCacheKey>
  >;
  private readonly recordsPerPage: number;
  private readonly onChange?: () => void;

  public constructor({
    maxPages = 200,
    recordsPerPage = DELETE_BLOCKER_LIMIT,
    onChange = undefined,
  }: {
    readonly recordsPerPage?: number;
    readonly maxPages?: number;
    readonly onChange?: () => void;
  } = {}) {
    this.recordsPerPage = recordsPerPage;
    this.pageCache = new DeleteBlockerLRU({
      maxPages,
      onEvict: (key, page) => this.unindexBlockerPage(key, page),
    });
    // We only allow one promise to be resolving at a time for counts, and
    // three for pages.
    // This should still let the browser handle other requests while fetching
    // blocker information for records with a lot of references
    this.countPromiseQueue = new PromiseQueue(1);
    this.pagePromiseQueue = new PromiseQueue(3);
    this.nodes = new Map();
    this.cascadeParents = new Map();
    this.recordLocations = new Map();
    this.onChange = onChange;
  }

  public getNode(nodeKey: ResourceIdentifier) {
    return this.nodes.get(nodeKey);
  }

  public pageSize(): number {
    return this.recordsPerPage;
  }

  public destroy() {
    this.countPromiseQueue.clear();
    this.pagePromiseQueue.clear();
    this.pageCache.clear();
    this.nodes.clear();
    this.recordLocations.clear();
    this.cascadeParents.clear();
  }

  private getOrCreateNode(resource: SpecifyResource<AnySchema>): BlockerNode {
    const resourceKey = resourceToStringIdentifier(resource);
    // REFACTOR: We could replace the following with getOrInsert
    const existingNode = this.getNode(resourceKey);
    if (existingNode !== undefined) {
      return existingNode;
    }
    const newNode: BlockerNode = {
      key: resourceKey,
      resource,
      relationshipMetaData: new Map(),
      cascadeChildren: new Set(),
      version: 0,
    };
    this.nodes.set(resourceKey, newNode);
    return newNode;
  }

  private getOrCreateRelationship(
    node: BlockerNode,
    table: Lowercase<keyof Tables>,
    field: string
  ): BlockerRelationship {
    const relationshipKey = this.nodeRelationshipKey(node, table, field);
    const existingRelationship = node.relationshipMetaData.get(relationshipKey);

    if (existingRelationship !== undefined) {
      return existingRelationship;
    }

    const newRelationship: BlockerRelationship = {
      key: relationshipKey,
      table,
      field,
    };
    node.relationshipMetaData.set(relationshipKey, newRelationship);
    return newRelationship;
  }

  public nodeRelationshipKey(
    node: BlockerNode,
    table: keyof Tables | Lowercase<keyof Tables>,
    field: string
  ) {
    return makeBlockerKey(node.key, table.toLowerCase(), field.toLowerCase());
  }

  public async seedBlockers(resource: SpecifyResource<AnySchema>) {
    const queueKey = buildPageCacheKey(resource);
    const promiseInQueue = this.pagePromiseQueue.get(queueKey);
    if (promiseInQueue === false || promiseInQueue !== undefined) {
      return promiseInQueue;
    }
    return this.pagePromiseQueue.enqueue(queueKey, () =>
      this.handleMainBlockers(resource)
    );
  }

  private async handleMainBlockers(resource: SpecifyResource<AnySchema>) {
    return fetchInitialBlockers(
      resource.specifyTable.name,
      resource.id,
      this.recordsPerPage
    ).then((blockers) => {
      return this.handleDeleteBlockerPage(resource, blockers);
    });
  }

  private handleDeleteBlockerPage(
    resource: SpecifyResource<AnySchema>,
    blockers: APIDeleteBlockers
  ): RA<DeleteBlockerLRUPage> {
    const node = this.getOrCreateNode(resource);
    const cachedPages = this.applyBlockerPages(node, blockers.results);
    this.updateAncestors(node.key);
    this.queueNextBlockers(resource, blockers.next);
    this.fetchCountsForResource(resource);
    this.onChange?.();
    return cachedPages;
  }

  private applyBlockerPages(
    node: BlockerNode,
    blockerPages: RA<APIDeleteBlockerPage>
  ): RA<DeleteBlockerLRUPage> {
    return blockerPages.map((page) => this.applyBlockerPage(node, page));
  }

  private applyBlockerPage(
    node: BlockerNode,
    blockerPage: APIDeleteBlockerPage
  ) {
    this.getOrCreateRelationship(node, blockerPage.table, blockerPage.field);
    const blockerKey = blockerPageToCacheKey(node.resource, blockerPage);
    const existingPage = this.pageCache.peekPage(blockerKey);
    if (existingPage !== undefined) {
      this.unindexBlockerPage(blockerKey, existingPage);
    }
    const cachedPage = this.pageCache.cachePage(node.resource, blockerPage);
    this.indexBlockerPage(blockerKey, blockerPage);
    return cachedPage;
  }

  private indexBlockerPage(
    blockerPageCacheKey: BlockerPageCacheKey,
    blockerPage: APIDeleteBlockerPage | DeleteBlockerLRUPage
  ) {
    for (const id of blockerPage.ids) {
      const resourceKey = makeBlockerKey(blockerPage.table.toLowerCase(), id);
      this.recordLocations
        .getOrInsert(resourceKey, new Set())
        .add(blockerPageCacheKey);
    }
  }

  private unindexBlockerPage(
    pageKey: BlockerPageCacheKey,
    blockerPage: DeleteBlockerLRUPage
  ) {
    for (const id of blockerPage.ids) {
      const resourceKey = makeBlockerKey(blockerPage.table.toLowerCase(), id);
      this.removeRecordLocation(resourceKey, pageKey);
    }
  }

  public removeDeletedResource(resourceKey: ResourceIdentifier) {
    const otherRecordsWithPage = this.removeRecordFromPages(resourceKey);

    this.pageCache.removePagesOwnedBy(resourceKey);

    const affectedParents = this.removeIndexesFor(resourceKey);

    const allAffectedRecords = otherRecordsWithPage.union(affectedParents);

    for (const key of allAffectedRecords) {
      if (this.nodes.has(key)) this.updateAncestors(key);
      this.queueBlockerCount(key);
    }
    this.onChange?.();
  }

  private removeRecordFromPages(resourceKey: ResourceIdentifier) {
    const otherRecordsWithPage = new Set<ResourceIdentifier>(resourceKey);
    const blockerCacheKeys = [...(this.recordLocations.get(resourceKey) ?? [])];
    for (const cacheKey of blockerCacheKeys) {
      const blockerPage = this.pageCache.peekPage(cacheKey);

      if (blockerPage === undefined) {
        this.removeRecordLocation(resourceKey, cacheKey);
        continue;
      }

      const table = blockerPage.table.toLowerCase();
      const remainingRecordIds = blockerPage.ids.filter(
        (id) => makeBlockerKey(table, id) !== resourceKey
      );
      if (remainingRecordIds.length === blockerPage.ids.length) {
        this.removeRecordLocation(resourceKey, cacheKey);
        continue;
      }
      const ownerIdentifier: ResourceIdentifier = makeBlockerKey(
        blockerPage.ownerTable.toLowerCase(),
        blockerPage.ownerId
      );
      otherRecordsWithPage.add(ownerIdentifier);
      const updatedPage: DeleteBlockerLRUPage = {
        ...blockerPage,
        ids: remainingRecordIds,
      };
      // We probably don't need to re-index the page here, but just to be safe
      this.unindexBlockerPage(cacheKey, blockerPage);
      this.pageCache.replacePage(cacheKey, updatedPage);
      this.indexBlockerPage(cacheKey, updatedPage);
      this.invalidateCounts(ownerIdentifier);
    }
    return otherRecordsWithPage;
  }
  private removeRecordLocation(
    resourceKey: ResourceIdentifier,
    blockerCacheKey: BlockerPageCacheKey
  ) {
    const pageKeys = this.recordLocations.get(resourceKey);
    if (pageKeys === undefined) {
      return;
    }
    pageKeys.delete(blockerCacheKey);
    if (pageKeys.size === 0) {
      this.recordLocations.delete(resourceKey);
    }
  }
  private removeIndexesFor(resourceKey: ResourceIdentifier) {
    const affectedParents = this.removeRecordFromParents(resourceKey);
    this.removeChildrenFrom(resourceKey);
    this.nodes.delete(resourceKey);
    return affectedParents;
  }

  private removeRecordFromParents(resourceKey: ResourceIdentifier) {
    const affectedParents = new Set<ResourceIdentifier>();
    const parentKeys = this.cascadeParents.get(resourceKey);

    if (parentKeys === undefined) {
      return affectedParents;
    }

    for (const parentKey of parentKeys) {
      const parent = this.getNode(parentKey);
      if (parent === undefined) continue;
      parent.cascadeChildren.delete(resourceKey);
      affectedParents.add(parentKey);
    }

    this.cascadeParents.delete(resourceKey);
    return affectedParents;
  }

  private removeChildrenFrom(resourceKey: ResourceIdentifier) {
    const node = this.getNode(resourceKey);
    if (node === undefined) {
      return;
    }
    for (const childKey of node.cascadeChildren) {
      const childParents = this.cascadeParents.get(childKey);
      if (childParents === undefined) continue;

      childParents.delete(resourceKey);

      if (childParents.size === 0) {
        this.cascadeParents.delete(childKey);
      }
    }
    node.cascadeChildren.clear();
  }

  public async fetchCountsForResource(resource: SpecifyResource<AnySchema>) {
    const countKey = resourceToStringIdentifier(resource);
    return this.queueBlockerCount(countKey);
  }

  private queueBlockerCount(resourceKey: ResourceIdentifier) {
    const alreadyQueued = this.countPromiseQueue.get(resourceKey);
    const [tableName, resourceId] = identifierToParts(resourceKey);
    if (alreadyQueued === false) {
      return false;
    }
    if (alreadyQueued !== undefined) {
      return undefined;
    }

    const fetchCounts = () =>
      fetchReferenceCounts(tableName, resourceId).then((counts) =>
        this.handleDeleteBlockerCounts(resourceKey, counts)
      );

    return this.countPromiseQueue.enqueue(resourceKey, fetchCounts);
  }

  private invalidateCounts(resourceKey: ResourceIdentifier) {
    const node = this.getNode(resourceKey);
    if (node === undefined) return;
    node.count = undefined;
    node.relationshipMetaData.forEach((blockerRelationship) => {
      blockerRelationship.count = undefined;
    });
  }
  private handleDeleteBlockerCounts(
    resourceKey: ResourceIdentifier,
    counts: APIDeleteBlockerCounts
  ) {
    const node = this.getNode(resourceKey);
    if (node === undefined) {
      // We're expecting the node to exist at this point, but maybe the
      // resource was deleted between the time the count request was made and
      // this is executing?
      console.warn(
        'Trying to handle counts for record not in DeleteBlocker state',
        { resource: resourceKey }
      );
      return;
    }
    node.count = counts.total_count;
    node.relationshipMetaData.forEach((blockerRelationship) => {
      blockerRelationship.count = 0;
    });
    counts.results.forEach((relationshipCount) =>
      this.addCountsToRelationship(node, relationshipCount)
    );
    this.updateAncestors(node.key);
    this.onChange?.();
  }

  private addCountsToRelationship(
    node: BlockerNode,
    referenceCounts: APIDeleteBlockerCount
  ) {
    const { table, field, count } = referenceCounts;
    const relationshipKey = this.nodeRelationshipKey(node, table, field);
    const relationship = node.relationshipMetaData.get(relationshipKey);
    if (relationship === undefined) {
      // We're expecting this relationship to already exist on the node.
      // Maybe all records in the relationship were deleted and it was removed?
      console.warn('Trying to handle counts for missing relationship', {
        resource: resourceToStringIdentifier(node.resource),
        table,
        field,
      });
      return;
    }
    relationship.count = count;
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
    const isCached = this.pageCache.peekPage(key);
    return isCached !== undefined;
  }

  private async queueNextBlocker(
    resource: SpecifyResource<AnySchema>,
    nextBlocker: APIDeleteBlockerPage
  ) {
    const parentNode = this.getOrCreateNode(resource);

    const table = getTable(nextBlocker.table);
    if (table === undefined) {
      softFail('Unknown table for Delete Blocker');
      return;
    }
    for (const id of nextBlocker.ids) {
      const childResource = new table.Resource(
        { id },
        { noBusinessRules: true }
      );
      const childNode = this.getOrCreateNode(childResource);
      const marked = this.addCascadeRelationship(parentNode, childNode);
      if (marked) {
        this.updateAncestors(parentNode.key);
      }
      this.seedBlockers(childResource);
    }
    // We need to handle queuing up the rest of the next blockers
    if (nextBlocker.complete === false) {
      this.handleNextPage(resource, nextBlocker);
    }
  }

  private addCascadeRelationship(
    parentNode: BlockerNode,
    childNode: BlockerNode
  ): boolean {
    const hasChild = parentNode.cascadeChildren.has(childNode.key);

    if (hasChild) {
      return false;
    }

    parentNode.cascadeChildren.add(childNode.key);

    this.cascadeParents
      .getOrInsert(childNode.key, new Set())
      .add(parentNode.key);

    return true;
  }

  private updateNode(node: BlockerNode) {
    node.version += 1;
  }

  public graphIterator(
    rootKey: ResourceIdentifier,
    direction: 'children' | 'ancestors',
    nodeFunction: (node: BlockerNode) => void
  ) {
    const visitedRecords = new Set<ResourceIdentifier>();
    const stack: WritableArray<ResourceIdentifier> = [rootKey];

    while (stack.length > 0) {
      const currentKey = stack.pop()!;
      if (visitedRecords.has(currentKey)) {
        continue;
      }
      visitedRecords.add(currentKey);
      const node = this.getNode(currentKey);
      if (node === undefined) {
        continue;
      }
      nodeFunction(node);
      const collection =
        direction === 'ancestors'
          ? this.cascadeParents.get(currentKey)
          : node.cascadeChildren;
      for (const nextKey of collection ?? []) {
        stack.push(nextKey);
      }
    }
  }

  private updateAncestors(changedKey: ResourceIdentifier) {
    this.graphIterator(changedKey, 'ancestors', this.updateNode);
  }

  public getBlockerPage(cacheKey: string) {
    return this.pageCache.getPage(cacheKey);
  }

  public async filterBlockers(
    resource: SpecifyResource<AnySchema>,
    relatedTable: keyof Tables | Lowercase<keyof Tables>,
    relationshipName: string,
    anchor: number | null | 'last' = null,
    backwards: boolean = false
  ) {
    const cacheKey = buildPageCacheKey(
      resource,
      relatedTable,
      relationshipName,
      anchor
    );
    if (this.pageIsCached(cacheKey)) {
      return this.getBlockerPage(cacheKey);
    }
    if (this.pageIsFetching(cacheKey)) {
      return undefined;
    }
    const fetchBlockers = () =>
      filterDeleteBlockers(resource.specifyTable.name, resource.id, [
        {
          table: relatedTable,
          field: relationshipName,
          anchor: pageAnchorToFilter(anchor),
          // This is needed to fetch the last page
          // A null anchor depends on the direction of the request
          backwards: anchor === 'last' ? true : backwards,
          limit: this.recordsPerPage,
        },
      ])
        .then((blockers) => {
          return anchor === 'last' || backwards === true
            ? {
                ...blockers,
                results: blockers.results.map((page) => ({
                  ...page,
                  ids: [...page.ids].reverse(),
                  // We normally treat backwards requests the same as forwards
                  // and transform them accordingly.
                  // However when the last page is requested then it's
                  // important to include indication of backwards as that's the
                  // only way to know the last page was requested.
                  // See blockerPageToCacheKey
                  // REFACTOR: Maybe we can define a modified type of the API
                  // response and pass those to the cache that allows anchor to
                  // be 'false'.
                  // That would decouple the anchor + backwards pairing to make
                  // working with cached pages easier
                  backwards: anchor === 'last',
                })),
              }
            : blockers;
        })
        .then((blockers) => this.handleDeleteBlockerPage(resource, blockers));
    return this.pagePromiseQueue.enqueue(cacheKey, fetchBlockers);
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
