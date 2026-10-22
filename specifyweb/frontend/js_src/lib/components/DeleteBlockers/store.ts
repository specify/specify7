import { RA, Writable, WritableArray } from '../../utils/types';
import { AnySchema } from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { Relationship } from '../DataModel/specifyField';
import { Tables } from '../DataModel/types';
import {
  BlockerPageCacheKey,
  buildPageCacheKey,
  DeleteBlockerLRUPage,
  makeBlockerKey,
} from './pageCache';
import {
  BlockerNode,
  DeleteBlockerState,
  ResourceIdentifier,
  resourceToStringIdentifier,
} from './state';

export type DeleteBlockerRelationship = {
  readonly key: BlockerPageCacheKey;
  readonly relationshipName: string;
  readonly count?: number;
};

export type DeleteBlockerTable = {
  readonly tableName: string;
  readonly count?: number;
  readonly relationships: RA<DeleteBlockerRelationship>;
};

export type DeleteBlockerResource = {
  readonly key: ResourceIdentifier;
  readonly resource: SpecifyResource<AnySchema>;
  readonly count?: number;
  readonly tables: RA<DeleteBlockerTable>;
};

type MutableDeleteBlockerTable = Writable<
  Omit<DeleteBlockerTable, 'relationships'>
> & {
  relationships: Map<string, DeleteBlockerRelationship>;
};

export class DeleteBlockerStore {
  private readonly state: DeleteBlockerState;

  private readonly listeners = new Set<() => void>();

  public constructor(
    blockerStateParams: ConstructorParameters<
      typeof DeleteBlockerState
    >[0] = undefined
  ) {
    const params: ConstructorParameters<typeof DeleteBlockerState>[0] = {
      ...blockerStateParams,
      onChange: () => {
        blockerStateParams?.onChange?.();
        this.notify();
      },
    };
    this.state = new DeleteBlockerState(params);
  }

  public readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  public notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  public pageSize(): number {
    return this.state.pageSize();
  }

  public async seedBlockers(resource: SpecifyResource<AnySchema>) {
    return this.state.seedBlockers(resource);
  }

  public getAllBlockerCounts(resource: SpecifyResource<AnySchema>) {
    const blockerKey = resourceToStringIdentifier(resource);
    const node = this.getNode(blockerKey);
    if (node === undefined) {
      return undefined;
    }
    let countsPending = false;
    let totalCount = 0;
    this.state.graphIterator(blockerKey, 'children', (node) => {
      if (node.version === 0 || node.count === undefined) {
        countsPending = true;
        return true;
      }
      totalCount += node.count;
      return false;
    });
    return countsPending ? undefined : totalCount;
  }

  public getReferenceCountForRelationship(
    resource: SpecifyResource<AnySchema>,
    relationship: Relationship
  ) {
    const blockerKey = resourceToStringIdentifier(resource);
    const node = this.getNode(blockerKey);
    if (node === undefined) {
      return undefined;
    }
    const relationshipKey = this.state.nodeRelationshipKey(
      node,
      relationship.table.name,
      relationship.name
    );
    const blockerRelationship = node.relationshipMetaData.get(relationshipKey);
    return blockerRelationship?.count;
  }

  public filterBlockers(
    resource: SpecifyResource<AnySchema>,
    relationship: Relationship,
    anchor: number | null | 'last' = null,
    backwards: boolean = false
  ) {
    return this.state.filterBlockers(
      resource,
      relationship.table.name,
      relationship.name,
      anchor,
      backwards
    );
  }

  public getCachedPage(
    resource: SpecifyResource<AnySchema>,
    relationship: Relationship,
    anchor: number | null | 'last' = null
  ): DeleteBlockerLRUPage | undefined {
    const cacheKey = buildPageCacheKey(
      resource,
      relationship.table.name,
      relationship.name,
      anchor
    );
    return this.state.getBlockerPage(cacheKey);
  }

  public removeResource(
    table: keyof Tables | Lowercase<keyof Tables>,
    recordId: number
  ) {
    const resourceKey = makeBlockerKey(table.toLowerCase(), recordId);
    this.state.removeResource(resourceKey);
  }

  public getDirectBlockers(
    resource: SpecifyResource<AnySchema>
  ): DeleteBlockerResource | undefined {
    const identifier = resourceToStringIdentifier(resource);
    const node = this.getNode(identifier);
    if (node === undefined) {
      return undefined;
    }
    return this.blockerNodeToResource(node);
  }

  public getBlockerGraph(
    resource: SpecifyResource<AnySchema>
  ): RA<DeleteBlockerResource> | undefined {
    const identifier = resourceToStringIdentifier(resource);
    const node = this.getNode(identifier);
    if (node === undefined) {
      return undefined;
    }
    const results: WritableArray<DeleteBlockerResource> = [];
    this.state.graphIterator(identifier, 'children', (node) => {
      const blockerResource = this.blockerNodeToResource(node);
      if (
        blockerResource !== undefined &&
        (blockerResource.count === undefined || blockerResource.count > 0)
      ) {
        results.push(blockerResource);
      }
      return false;
    });
    return results;
  }

  public getNode(nodeKey: ResourceIdentifier) {
    return this.state.getNode(nodeKey);
  }

  public clearState() {
    this.state.destroy();
  }

  private blockerNodeToResource(
    node: BlockerNode
  ): DeleteBlockerResource | undefined {
    // The node is still being initialized
    if (node.version === 0) {
      return undefined;
    }
    const tables = new Map<string, MutableDeleteBlockerTable>();
    let resourceCount = 0;
    let hasUndefinedCounts = false;

    for (const relationship of node.relationshipMetaData.values()) {
      const defaultTable: MutableDeleteBlockerTable = {
        tableName: relationship.table,
        relationships: new Map(),
      };
      const foundTable = tables.get(relationship.table);
      if (foundTable === undefined) {
        tables.set(relationship.table, defaultTable);
      }
      const table = tables.get(relationship.table)!;

      if (relationship.count === undefined) {
        hasUndefinedCounts = true;
      } else if (relationship.count > 0) {
        table.count = table.count ?? 0 + relationship.count;
        resourceCount += relationship.count;
      } else {
        table.count = 0;
        continue;
      }

      const relationshipKey = makeBlockerKey(
        relationship.table,
        relationship.field
      );
      table.relationships.set(relationshipKey, {
        key: relationship.key,
        relationshipName: relationship.field,
        count: relationship.count,
      });
    }
    return {
      resource: node.resource,
      key: node.key,
      count: hasUndefinedCounts ? undefined : resourceCount,
      tables: Array.from(tables.values(), (table) => ({
        tableName: table.tableName,
        count: table.count,
        relationships: Array.from(table.relationships.values()),
      })),
    };
  }
}
