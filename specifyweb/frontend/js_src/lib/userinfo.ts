/**
 * Fetch basic SpecifyUser information
 */

import type { Agent } from './datamodel';
import type { SerializedModel } from './datamodelutils';
import { load } from './initialcontext';
import type { IR, RA, Writable } from './types';

export type UserInfo = {
  // NOTE: some userInfo properties are not listed here
  readonly id: number;
  // Whether user is super admin in Sp7. Different from Sp6
  readonly isadmin: boolean;
  readonly isauthenticated: boolean;
  readonly availableCollections: IR<string>;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly resource_uri: string;
  readonly agent: SerializedModel<Agent>;
  readonly name: string;
  readonly usertype: string;
};

const userInfo: Writable<UserInfo> = {} as Writable<UserInfo>;

export const fetchContext = load<
  Omit<UserInfo, 'availableCollections'> & {
    readonly available_collections: RA<[id: number, name: string]>;
  }
>('/context/user.json', 'application/json').then(
  ({ available_collections, ...data }) => {
    Object.entries(data).forEach(([key, value]) => {
      // @ts-expect-error
      userInfo[key as keyof UserInfo] = value;
    });
    userInfo.availableCollections = Object.fromEntries(available_collections);
  }
);

export const userInformation: UserInfo = userInfo;
