import type SaveBlockers from './saveblockers';
import type SpecifyModel from './specifymodel';
import type { IR, RA } from './types';

type DomainTreeDefinitionItem = {
  readonly get: (fieldName: string) => number | string;
  readonly rget: (fieldName: string) => Promise<DomainTreeDefinitionItem>;
  readonly attributes: { name: string; rankid: number; parent: string };
};

type SpecifyRequest = (parameter: IR<unknown>) => JqueryPromise<void>;

type DomainTreeDefinitionItems = {
  readonly fetch: SpecifyRequest;
  readonly models: IR<DomainTreeDefinitionItem>;
};

type DomainTreeDefinition = {
  readonly rget: (
    fieldName: string
  ) => JqueryPromise<DomainTreeDefinitionItems>;
};

export type SpecifyResource = {
  readonly id: number;
  readonly get: (fieldName: string) => unknown;
  readonly rget: (fieldName: string) => JqueryPromise<unknown>;
  readonly set: (fieldName: string, value: unknown) => void;
  readonly save: () => JqueryPromise<void>;
  readonly viewUrl: () => string;
  readonly Resource: new () => SpecifyResource;
  readonly isNew: () => boolean;
  readonly clone: () => SpecifyResource;
  readonly specifyModel: SpecifyModel;
  readonly saveBlockers: Readonly<SaveBlockers>;
  readonly parent?: SpecifyResource;
  readonly format: () => JqueryPromise<string>;
  readonly collection: {
    readonly related: SpecifyResource;
  };
  readonly on: (
    eventName: string,
    callback: (...args: RA<never>) => void
  ) => void;
  readonly off: (
    eventName?: string,
    callback?: (...args: RA<never>) => void
  ) => void;
  readonly trigger: (eventName: string, ...args: RA<unknown>) => void;
};

export type JqueryPromise<T> = {
  readonly done: (callback: (t: T) => void) => void;
  readonly then: (callback: (t: T) => void) => void;
};

export type GetTreeDefinition = (
  tableName: string
) => JqueryPromise<DomainTreeDefinition>;
