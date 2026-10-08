import { RA, RR, Writable, WritableArray } from '../../utils/types';
import { AnySchema } from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { Tables } from '../DataModel/types';
import {
  BlockerNode,
  DeleteBlockerState,
  makeBlockerKey,
  ResourceIdentifier,
  resourceToStringIdentifier,
} from './state';
import { BlockerPageCacheKey } from './types';

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

  public async seedBlockers(resource: SpecifyResource<AnySchema>) {
    return this.state.seedBlockers(resource);
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
      if (blockerResource !== undefined) {
        results.push(blockerResource);
      }
    });
    return results.length <= 0 ? undefined : results;
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
    // The node is still be initialized
    if (node.relationshipMetaData.size === 0) {
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
      const table = tables.getOrInsert(relationship.table, defaultTable);

      const relationshipKey = makeBlockerKey(
        relationship.table,
        relationship.field
      );
      table.relationships.set(relationshipKey, {
        key: relationship.key,
        relationshipName: relationship.field,
        count: relationship.count,
      });
      if (relationship.count !== undefined) {
        table.count = table.count ?? 0 + relationship.count;
        resourceCount += relationship.count;
      } else {
        hasUndefinedCounts = true;
      }
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
