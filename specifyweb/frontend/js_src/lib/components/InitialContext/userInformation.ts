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
  readonly currentCollectionAgent: SerializedRecord<Agent> | null;
  readonly agent: SerializedRecord<Agent> | null;
};

const userInfo: Writable<UserInformation> = {} as UserInformation;

export const fetchContext = load<
  Omit<UserInformation, 'availableCollections' | 'currentCollectionAgent'> & {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly available_collections: RA<SerializedRecord<Collection>>;
    readonly current_agent?: SerializedRecord<Agent> | null;
  }
>('/context/user.json', 'application/json').then(
  async ({ available_collections: availableCollections, ...data }) => {
    const currentCollectionAgent = data.current_agent ?? data.agent ?? null;
    const rest = { ...data };
    delete rest.current_agent;
    Object.entries(rest).forEach(([key, value]) => {
      // @ts-expect-error
      userInfo[key as keyof UserInformation] = value;
    });
    userInfo.currentCollectionAgent = currentCollectionAgent;
    userInfo.agent = currentCollectionAgent;
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
