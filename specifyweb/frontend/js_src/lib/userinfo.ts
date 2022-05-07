/**
 * Fetch basic SpecifyUser information
 */

import type { Agent, Collection, SpecifyUser } from './datamodel';
import type { SerializedModel, SerializedResource } from './datamodelutils';
import { serializeResource } from './datamodelutils';
import { load } from './initialcontext';
import { fetchContext as fetchSchema } from './schema';
import type { RA, Writable } from './types';

export type UserInfo = SerializedModel<SpecifyUser> & {
  readonly isauthenticated: boolean;
  readonly availableCollections: RA<SerializedResource<Collection>>;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly agent: SerializedModel<Agent>;
};

const userInfo: Writable<UserInfo> = {} as Writable<UserInfo>;

export const fetchContext = load<
  Omit<UserInfo, 'availableCollections'> & {
    readonly available_collections: RA<SerializedModel<Collection>>;
  }
>('/context/user.json', 'application/json').then(
  ({ available_collections, ...data }) => {
    Object.entries(data).forEach(([key, value]) => {
      // @ts-expect-error
      userInfo[key as keyof UserInfo] = value;
    });
    return fetchSchema.then(() => {
      userInfo.availableCollections =
        available_collections.map(serializeResource);
    });
  }
);

export const userInformation: UserInfo = userInfo;
