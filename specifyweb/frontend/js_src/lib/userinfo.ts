import $ from 'jquery';

import { load } from './initialcontext';
import commonText from './localization/common';
import type { IR, RA, Writable } from './types';

export type UserType = 'Manager' | 'FullAccess' | 'LimitedAccess' | 'Guest';

export type UserInfo = {
  // NOTE: some userInfo properties are not listed here
  readonly id: number;
  readonly isadmin: boolean;
  readonly isReadOnly: boolean;
  readonly usertype: UserType;
  readonly isauthenticated: boolean;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly available_collections: RA<
    Readonly<[collectionId: number, collectionName: string]>
  >;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly resource_uri: string;
  readonly agent: IR<unknown>;
  readonly name: string;
};

const userInfo: Writable<UserInfo> = {} as Writable<UserInfo>;

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
