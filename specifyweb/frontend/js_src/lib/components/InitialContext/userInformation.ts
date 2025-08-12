/**
 * Fetch basic SpecifyUser information
 */

import type { LocalizedString } from 'typesafe-i18n';

import type { RA, Writable } from '../../utils/types';
import { setDevelopmentGlobal } from '../../utils/types';
import type {
  SerializedRecord,
  SerializedResource,
} from '../DataModel/helperTypes';
import { serializeResource } from '../DataModel/serializers';
import type { Agent, Collection, SpecifyUser } from '../DataModel/types';
import { load } from './index';

export type UserInformation = SerializedRecord<SpecifyUser> & {
  readonly name: LocalizedString;
  readonly isauthenticated: boolean;
  readonly availableCollections: RA<SerializedResource<Collection>>;
  readonly agent: SerializedRecord<Agent>;
  readonly isloggedin: boolean;
};

const userInfo: Writable<UserInformation> = {} as UserInformation;

export const fetchContext = load<
  Omit<UserInformation, 'availableCollections'> & {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly available_collections: RA<SerializedRecord<Collection>>;
  }
>('/context/user.json', 'application/json').then(
  async ({ available_collections: availableCollections, ...data }) => {
    Object.entries(data).forEach(([key, value]) => {
      // @ts-expect-error
      userInfo[key as keyof UserInformation] = value;
    });
    await import('../DataModel/tables').then(
      async ({ fetchContext }) => fetchContext
    );
    await import('../DataModel/schema').then(
      async ({ fetchContext }) => fetchContext
    );
    userInfo.availableCollections = availableCollections.map(serializeResource);
    setDevelopmentGlobal('_user', userInfo);
    return userInfo;
  }
);

export const userInformation: UserInformation = userInfo;
