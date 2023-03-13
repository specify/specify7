/**
 * Fetch basic SpecifyUser information
 */

import type { LocalizedString } from 'typesafe-i18n';

import type { RA, Writable } from '../../utils/types';
import { setDevelopmentGlobal } from '../../utils/types';
import { serializeResource } from '../DataModel/helpers';
import type {
  SerializedModel,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { Agent, Collection, SpecifyUser } from '../DataModel/types';
import { load } from './index';

export type UserInformation = SerializedModel<SpecifyUser> & {
  readonly name: LocalizedString;
  readonly isauthenticated: boolean;
  readonly availableCollections: RA<SerializedResource<Collection>>;
  readonly agent: SerializedModel<Agent>;
};

const userInfo: Writable<UserInformation> = {} as UserInformation;

export const fetchContext = load<
  Omit<UserInformation, 'availableCollections'> & {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly available_collections: RA<SerializedModel<Collection>>;
  }
>('/context/user.json', 'application/json').then(
  async ({ available_collections: availableCollections, ...data }) => {
    Object.entries(data).forEach(([key, value]) => {
      // @ts-expect-error
      userInfo[key as keyof UserInformation] = value;
    });
    await import('../DataModel/schema').then(
      async ({ fetchContext }) => fetchContext
    );
    await import('../DataModel/schemaBase').then(
      async ({ fetchContext }) => fetchContext
    );
    userInfo.availableCollections = availableCollections.map(serializeResource);
    setDevelopmentGlobal('_user', userInfo);
    return userInfo;
  }
);

export const userInformation: UserInformation = userInfo;
