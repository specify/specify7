import React from 'react';

import { isExternalUrl } from '../ajax';
import { commonText } from '../localization/common';
import type { IR, RA } from '../types';
import { userInformation } from '../userinfo';
import { userToolsPromise } from '../usertools';
import { Button, H3, Link, Ul } from './basic';
import { useAsyncState } from './hooks';
import { icons } from './icons';
import type { UserTool } from './main';
import { Dialog } from './modaldialog';
import { OverlayContext } from './router';

export function UserTools(): JSX.Element {
  // REFACTOR: get rid of usages of "px" units in the header
  return (
    <Link.Small
      className={`
          text-overflow-ellipsis max-w-[110px] overflow-hidden
          whitespace-nowrap normal-case
        `}
      href="/specify/overlay/user-tools/"
      title={commonText('currentUser')}
    >
      {userInformation.name}
    </Link.Small>
  );
}

export function UserToolsOverlay(): JSX.Element | null {
  const [userTools] = useAsyncState<RA<IR<RA<UserTool>>>>(
    React.useCallback(async () => userToolsPromise, []),
    true
  );
  const handleClose = React.useContext(OverlayContext);
  return Array.isArray(userTools) ? (
    <Dialog
      buttons={<Button.DialogClose>{commonText('close')}</Button.DialogClose>}
      header={commonText('userToolsDialogTitle')}
      icon={<span className="text-blue-500">{icons.cog}</span>}
      onClose={handleClose}
    >
      <nav className="flex gap-2">
        {userTools.map((groups, index) => (
          <UserToolsColumn groups={groups} key={index} onClose={handleClose} />
        ))}
      </nav>
    </Dialog>
  ) : null;
}

function UserToolsColumn({
  groups,
  onClose: handleClose,
}: {
  readonly groups: IR<RA<UserTool>>;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <div className="flex flex-1 flex-col gap-4">
      {Object.entries(groups).map(([groupName, userTools]) => (
        <div key={groupName}>
          <H3>{groupName}</H3>
          <Ul>
            {userTools
              .map((userTool) => ({
                ...userTool,
                basePath:
                  'basePath' in userTool
                    ? (
                        userTool as unknown as {
                          readonly basePath: string;
                        }
                      ).basePath
                    : '/specify/task/',
              }))
              .map(({ title, url }) => {
                const isExternalLink = isExternalUrl(url);
                const Component = isExternalLink ? Link.NewTab : Link.Default;
                return (
                  <li key={url}>
                    <Component
                      href={url}
                      onClick={(): void =>
                        isExternalLink ? undefined : handleClose()
                      }
                    >
                      {title}
                    </Component>
                  </li>
                );
              })}
          </Ul>
        </div>
      ))}
    </div>
  );
}
