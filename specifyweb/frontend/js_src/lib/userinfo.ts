import { dialogClassNames, showDialog } from './components/modaldialog';
import type { Agent } from './datamodel';
import type { SerializedModel } from './datamodelutils';
import { load } from './initialcontext';
import commonText from './localization/common';
import type { RA, Writable } from './types';

export type UserInfo = {
  // NOTE: some userInfo properties are not listed here
  readonly id: number;
  readonly isauthenticated: boolean;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly available_collections: RA<
    Readonly<[collectionId: number, collectionName: string]>
  >;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly resource_uri: string;
  readonly agent: SerializedModel<Agent>;
  readonly name: string;
};

const userInfo: Writable<UserInfo> = {} as Writable<UserInfo>;

export const fetchContext = load<UserInfo>(
  '/context/user.json',
  'application/json'
).then((data) => {
  if (data.agent === null) {
    const dialog = showDialog({
      title: commonText('noAgentDialogTitle'),
      header: commonText('noAgentDialogHeader'),
      content: commonText('noAgentDialogMessage'),
      className: {
        container: `${dialogClassNames.narrowContainer}`,
      },
      onClose: (): void => window.location.assign('/accounts/logout/'),
      forceToTop: true,
      buttons: [
        {
          text: commonText('logOut'),
          style: 'Red',
          onClick: (): void => void dialog.remove(),
        },
      ],
    });
  }
  Object.entries({
    ...data,
    isReadOnly: !['Manager', 'FullAccess'].includes(data.usertype),
  }).forEach(([key, value]) => {
    // @ts-expect-error
    userInfo[key as keyof UserInfo] = value;
  });
});

export const userInformation: UserInfo = userInfo;
