import React from 'react';
import { useLocation } from 'react-router';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { headerText } from '../../localization/header';
import { userText } from '../../localization/user';
import { isExternalUrl } from '../../utils/ajax/helpers';
import type { IR, RA } from '../../utils/types';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import type { UserTool } from '../Core/Main';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';
import { MenuButton } from './index';
import { userToolsPromise } from './userToolDefinitions';

export function UserTools({
  isCollapsed,
}: {
  readonly isCollapsed: boolean;
}): JSX.Element {
  const { pathname } = useLocation();
  const [userTools] = useAsyncState(fetchUserTools, true);
  const isInUserTool = userTools?.some((group) =>
    Object.values(group)
      .flat()
      .some(({ url }) => pathname.startsWith(url))
  );
  return (
    <>
      {userInformation.isauthenticated ? (
        <MenuButton
          icon={icons.userCircle}
          isCollapsed={isCollapsed}
          isActive={isInUserTool}
          preventOverflow
          title={userInformation.name}
          onClick="/specify/overlay/user-tools/"
        />
      ) : (
        <>
          <MenuButton
            icon={icons.cog}
            isActive={isInUserTool}
            isCollapsed={isCollapsed}
            title={headerText.userTools()}
            onClick="/specify/overlay/user-tools/"
          />
          <MenuButton
            icon={icons.login}
            isCollapsed={isCollapsed}
            title={userText.logIn()}
            onClick="/accounts/login/"
          />
        </>
      )}
    </>
  );
}

const fetchUserTools = async (): typeof userToolsPromise => userToolsPromise;

export function UserToolsOverlay(): JSX.Element | null {
  const [userTools] = useAsyncState(fetchUserTools, true);
  const handleClose = React.useContext(OverlayContext);

  const [isReadOnly = false, setIsReadOnly] = useCachedState(
    'forms',
    'readOnlyMode'
  );

  return Array.isArray(userTools) ? (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      header={headerText.userTools()}
      icon={<span className="text-blue-500">{icons.cog}</span>}
      onClose={handleClose}
    >
      {isReadOnly && (
        <Button.Blue
          onClick={(): void => {
            setIsReadOnly(false);
            globalThis.location.reload();
          }}
        >
          {formsText.disableReadOnly()}
        </Button.Blue>
      )}
      <nav className="flex gap-2">
        {userTools.map((groups, index) => (
          <UserToolsColumn groups={groups} key={index} />
        ))}
      </nav>
    </Dialog>
  ) : null;
}

function UserToolsColumn({
  groups,
}: {
  readonly groups: IR<RA<UserTool>>;
}): JSX.Element {
  return (
    <div className="flex flex-1 flex-col gap-4">
      {Object.entries(groups).map(([groupName, userTools]) => (
        <div key={groupName}>
          <H3>{groupName}</H3>
          <Ul>
            {userTools.map(({ title, url }) => {
              const isExternalLink = isExternalUrl(url);
              // Make links to another entrypoint trigger page reload
              const LinkComponent = isExternalLink ? Link.NewTab : Link.Default;
              return (
                <li key={url}>
                  <LinkComponent href={url}>{title}</LinkComponent>
                </li>
              );
            })}
          </Ul>
        </div>
      ))}
    </div>
  );
}
