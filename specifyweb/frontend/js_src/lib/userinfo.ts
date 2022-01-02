import $ from 'jquery';

import { load } from './initialcontext';
import commonText from './localization/common';
import type { IR, RA } from './types';

export type UserType = 'Manager' | 'FullAccess' | 'LimitedAccess' | 'Guest';

type UserInfoWritable = {
  // NOTE: some userInfo properties are not listed here
  id: number;
  isadmin: boolean;
  isReadOnly: boolean;
  usertype: UserType;
  isauthenticated: boolean;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  available_collections: RA<
    Readonly<[collectionId: number, collectionName: string]>
  >;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  resource_uri: string;
  agent: IR<unknown>;
  name: string;
};

export type UserInfo = Readonly<UserInfoWritable>;

const userInfo: UserInfoWritable = {} as UserInfoWritable;

export const fetchContext = load<UserInfo>(
  '/context/user.json',
  'application/json'
).then((data) => {
  if (data.agent === null) {
    const dialog: JQuery = $(`<div>
      ${commonText('noAgentDialogHeader')}
      <p>${commonText('noAgentDialogMessage')}</p>
    </div>`).dialog({
      modal: true,
      dialogClass: 'ui-dialog-persistent',
      title: commonText('noAgentDialogTitle'),
      close: () => {
        window.location.href = '/accounts/logout/';
      },
      buttons: [
        {
          text: commonText('logOut'),
          click: () => dialog.dialog('close'),
        },
      ],
    });
    dialog[0].classList.add('ui-dialog-persistent');
  }
  Object.entries({
    ...data,
    isReadOnly: !['Manager', 'FullAccess'].includes(data.usertype),
  }).forEach(([key, value]) => {
    // @ts-expect-error
    userInfo[key as keyof UserInfo] = value;
  });
});

export default userInfo as UserInfo;
