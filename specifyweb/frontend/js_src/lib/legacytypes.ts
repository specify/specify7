import type SaveBlockers from './saveblockers';
import type SpecifyModel from './specifymodel';
import type { RA } from './types';

export type SpecifyResource = {
  readonly id: number;
  readonly get: <TYPE = unknown>(fieldName: string) => TYPE;
  readonly rget: <TYPE = unknown>(fieldName: string) => Promise<TYPE>;
  readonly set: (fieldName: string, value: unknown) => void;
  readonly save: () => Promise<void>;
  readonly viewUrl: () => string;
  readonly Resource: new () => SpecifyResource;
  readonly isNew: () => boolean;
  readonly clone: () => SpecifyResource;
  readonly specifyModel: SpecifyModel;
  readonly saveBlockers: Readonly<SaveBlockers>;
  readonly parent?: SpecifyResource;
  readonly format: () => Promise<string>;
  readonly url: () => string;
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

export type GetTreeDefinition = (tableName: string) => Promise<SpecifyResource>;
