import React from 'react';
import { useLocation } from 'react-router';

import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { headerText } from '../../localization/header';
import { userText } from '../../localization/user';
import { isExternalUrl } from '../../utils/ajax/helpers';
import type { IR, RA } from '../../utils/types';
import { sortFunction, split } from '../../utils/utils';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import type { MenuItem } from '../Core/Main';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';
import { locationToState } from '../Router/RouterState';
import { MenuButton } from './index';
import { useUserTools } from './menuItemProcessing';

export function UserTools({
  isCollapsed,
  isInUserTool,
}: {
  readonly isCollapsed: boolean;
  readonly isInUserTool: boolean;
}): JSX.Element {
  return (
    <>
      {userInformation.isauthenticated ? (
        <MenuButton
          icon={icons.userCircle}
          isActive={isInUserTool}
          isCollapsed={isCollapsed}
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

export function UserToolsOverlay(): JSX.Element | null {
  const userTools = useProcessedUserTools();

  const handleClose = React.useContext(OverlayContext);

  const [isReadOnly = false, setIsReadOnly] = useCachedState(
    'forms',
    'readOnlyMode'
  );

  return Array.isArray(userTools) ? (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      header={
        userInformation.isauthenticated
          ? headerText.userToolsForUser({ userName: userInformation.name })
          : headerText.userTools()
      }
      icon={icons.cog}
      onClose={handleClose}
    >
      {isReadOnly && (
        <Button.Info
          onClick={(): void => {
            setIsReadOnly(false);
            globalThis.location.reload();
          }}
        >
          {formsText.disableReadOnly()}
        </Button.Info>
      )}
      <nav className="flex gap-2">
        {userTools.map((groups, index) => (
          <UserToolsColumn groups={groups} key={index} />
        ))}
      </nav>
    </Dialog>
  ) : (
    <LoadingScreen />
  );
}

function useProcessedUserTools(): RA<IR<RA<MenuItem>>> | undefined {
  const rawUserTools = useUserTools();
  return React.useMemo(() => {
    if (rawUserTools === undefined) return undefined;
    const userTools = Object.entries(rawUserTools)
      .filter(([_name, userTools]) => Object.keys(userTools).length > 0)
      .map(
        ([name, userTools]) =>
          [
            name,
            Object.values(userTools).sort(sortFunction(({ title }) => title)),
          ] as const
      );
    /*
     * Can't split columns with CSS because break-inside:avoid is not yet
     * well-supported
     */
    return split(
      userTools,
      (_item, index, { length }) => index >= length / 2
    ).map((group) => Object.fromEntries(group));
  }, [rawUserTools]);
}

function UserToolsColumn({
  groups,
}: {
  readonly groups: IR<RA<MenuItem>>;
}): JSX.Element {
  const location = useLocation();
  const state = locationToState(location, 'BackgroundLocation');
  const backgroundLocation = state?.location?.pathname;
  return (
    <div className="flex flex-1 flex-col gap-4">
      {Object.entries(groups).map(([groupName, userTools]) => (
        <div className="flex flex-col gap-2" key={groupName}>
          <H3>{groupName}</H3>
          <Ul className="flex flex-col gap-1">
            {userTools.map(({ title, url, icon, onClick }) => {
              const isExternalLink = isExternalUrl(url);
              // Make links to another entrypoint trigger page reload
              const LinkComponent = isExternalLink ? Link.NewTab : Link.Default;

              return (
                <li key={url}>
                  <LinkComponent
                    aria-current={
                      typeof backgroundLocation === 'string' &&
                      backgroundLocation.startsWith(url)
                        ? 'page'
                        : undefined
                    }
                    href={url}
                    onClick={onClick}
                  >
                    {icon}
                    {title}
                  </LinkComponent>
                </li>
              );
            })}
          </Ul>
        </div>
      ))}
    </div>
  );
}
