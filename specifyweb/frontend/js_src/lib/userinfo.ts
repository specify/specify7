import type { IR, RA } from './components/wbplanview';
import initialContext from './initialcontext.js';
import commonText from './localization/common';

export type UserType = 'Manager' | 'FullAccess' | 'LimitedAccess' | 'Guest';

type UserInfoWritable = {
  // NOTE: some userInfo properties are not listed here
  id: number;
  isadmin: boolean;
  isReadOnly: boolean;
  usertype: UserType;
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

initialContext.load('user.json', (data: UserInfo) => {
  if (data.agent === null) {
    const dialog: JQuery<HTMLElement> = $(`<div>
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
