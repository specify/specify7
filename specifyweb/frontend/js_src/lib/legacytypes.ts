import { IR } from './types';
import Backbone from 'backbone';
import SpecifyModel from './specifymodel';
import type SaveBlockers from './saveblockers';

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

export type SpecifyResource = Backbone.Model & {
  readonly id: number;
  readonly get: (fieldName: string) => SpecifyResource | any;
  readonly rget: (fieldName: string) => JqueryPromise<SpecifyResource | any>;
  readonly set: (fieldName: string, value: any) => void;
  readonly save: () => JqueryPromise<void>;
  readonly viewUrl: () => string;
  readonly Resource: new () => SpecifyResource;
  readonly isNew: () => boolean;
  readonly clone: () => SpecifyResource;
  readonly specifyModel: SpecifyModel;
  readonly saveBlockers: SaveBlockers;
  readonly parent?: SpecifyResource;
  readonly format: () => JqueryPromise<string>;
  readonly collection: Backbone.Model['collection'] & {
    readonly related: SpecifyResource;
  };
};

export type JqueryPromise<T> = {
  readonly done: (callback: (t: T) => void) => void;
  readonly then: (callback: (t: T) => void) => void;
};

export type GetTreeDef = (
  tableName: string
) => JqueryPromise<DomainTreeDefinition>;
