import { PromiseQueue } from '../../utils/promiseQueue';
import { filterArray, RA, WritableArray } from '../../utils/types';
import { AnySchema } from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { getTable } from '../DataModel/tables';
import { Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import {
  DELETE_BLOCKER_LIMIT,
  fetchInitialBlockers,
  filterDeleteBlockers,
  groupBlockers,
} from './deleteBlockers';
import {
  blockerPageToCacheKey,
  DeleteBlockerLRU,
  DeleteBlockerLRUPage,
} from './pageCache';
import {
  APIDeleteBlockerPage,
  APIDeleteBlockers,
  BlockerPageCacheKey,
} from './types';

export type ResourceIdentifier = string;

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

type BlockerRelationship = {
  readonly key: BlockerPageCacheKey;
  readonly table: Lowercase<keyof Tables>;
  readonly field: string;
  readonly count?: number;
};

export type BlockerNode = {
  readonly key: ResourceIdentifier;
  readonly resource: SpecifyResource<AnySchema>;
  readonly count?: number;
  readonly relationshipMetaData: Map<string, BlockerRelationship>;
  readonly cascadeChildren: Set<string>;
  version: number;
};

export function resourceToStringIdentifier(
  resource: SpecifyResource<AnySchema>
): ResourceIdentifier {
  return makeBlockerKey(resource.specifyTable.name.toLowerCase(), resource.id);
}

function makeBlockerKey(...components: RA<unknown>) {
  return components.join('_');
}

// eslint-disable-next-line functional/no-class
export class DeleteBlockerState {
  private readonly pageCache: DeleteBlockerLRU;
  private readonly countPromiseQueue: PromiseQueue<string, unknown>;
  private readonly pagePromiseQueue: PromiseQueue<
    BlockerPageCacheKey,
    APIDeleteBlockers
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
    maxPages = 400,
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
    const existingNode = this.nodes.get(resourceKey);
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

  private nodeRelationshipKey(
    node: BlockerNode,
    table: Lowercase<keyof Tables>,
    field: string
  ) {
    return makeBlockerKey(node.key, table, field);
  }

  public async seedBlockers(resource: SpecifyResource<AnySchema>) {
    const queueKey = recordToBlockerCacheKey(resource);
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
  ) {
    const node = this.getOrCreateNode(resource);
    this.applyBlockerPages(node, blockers.results);
    this.updateAncestors(node.key);
    this.queueNextBlockers(resource, blockers.next);
    this.onChange?.();
    return blockers;
  }

  private applyBlockerPages(
    node: BlockerNode,
    blockerPages: RA<APIDeleteBlockerPage>
  ) {
    blockerPages.forEach((page) => {
      this.applyBlockerPage(node, page);
    });
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
    this.pageCache.cachePage(node.resource, blockerPage);
    this.indexBlockerPage(node.resource, blockerPage);
  }

  private indexBlockerPage(
    resource: SpecifyResource<AnySchema>,
    blockerPage: APIDeleteBlockerPage
  ) {
    for (const id of blockerPage.ids) {
      const resourceKey = makeBlockerKey(blockerPage.table.toLowerCase(), id);
      this.recordLocations
        .getOrInsert(resourceKey, new Set())
        .add(blockerPageToCacheKey(resource, blockerPage));
    }
  }

  private unindexBlockerPage(
    pageKey: BlockerPageCacheKey,
    blockerPage: DeleteBlockerLRUPage
  ) {
    for (const id of blockerPage.ids) {
      const resourceKey = makeBlockerKey(blockerPage.table.toLowerCase(), id);
      const locations = this.recordLocations.get(resourceKey);
      if (locations === undefined) {
        continue;
      }
      locations.delete(pageKey);
      if (locations.size <= 0) {
        this.recordLocations.delete(resourceKey);
      }
    }
  }

  // FIXME: add count support
  public async queueBlockerCounts(resource: SpecifyResource<AnySchema>) {
    const countKey = resourceToStringIdentifier(resource);
    const alreadyQueued = this.countPromiseQueue.get(countKey);
    if (alreadyQueued === false) {
      return false;
    }
    if (alreadyQueued !== undefined) {
      return undefined;
    }
  }

  public getBlockerGraph(
    resource: SpecifyResource<AnySchema>
  ): RA<BlockerNode> {
    const resourceKey = resourceToStringIdentifier(resource);
    const result: WritableArray<BlockerNode> = [];

    this.graphIterator(resourceKey, 'children', (node) => result.push(node));
    return result;
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

  private graphIterator(
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
      const node = this.nodes.get(currentKey);
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
    if (this.pageIsFetching(cacheKey) || this.pageIsCached(cacheKey)) {
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
