import React from 'react';

import { isExternalUrl } from '../../utils/ajax/helpers';
import { commonText } from '../../localization/common';
import type { IR, RA } from '../../utils/types';
import { userInformation } from '../InitialContext/userInformation';
import { userToolsPromise } from './userToolDefinitions';
import { H3, Ul } from '../Atoms';
import { useAsyncState } from '../../hooks/hooks';
import { icons } from '../Atoms/Icons';
import type { UserTool } from '../Core/Main';
import { Dialog } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';
import { Link } from '../Atoms/Link';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';

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

const fetchUserTools = async (): typeof userToolsPromise => userToolsPromise;

export function UserToolsOverlay(): JSX.Element | null {
  const [userTools] = useAsyncState(fetchUserTools, true);
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
            {userTools.map(({ title, url }) => {
              const isExternalLink = isExternalUrl(url);
              // Make links to another entrypoint trigger page reload
              const isDifferentEntrypoint =
                !isExternalLink && !url.startsWith('/specify');
              const LinkComponent = isExternalLink ? Link.NewTab : Link.Default;
              return (
                <li key={url}>
                  <LinkComponent
                    className={
                      isDifferentEntrypoint
                        ? className.navigationHandled
                        : undefined
                    }
                    href={url}
                    onClick={isExternalLink ? undefined : handleClose}
                  >
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
