import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { isExternalUrl } from '../../utils/ajax/helpers';
import type { IR, RA } from '../../utils/types';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import type { UserTool } from '../Core/Main';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';
import { userToolsPromise } from './userToolDefinitions';
import { formsText } from '../../localization/forms';
import { useCachedState } from '../../hooks/useCachedState';
import { headerText } from '../../localization/header';

export function UserTools(): JSX.Element {
  // REFACTOR: get rid of usages of "px" units in the header
  return (
    <Link.Small
      className={`
        text-overflow-ellipsis max-w-[110px] overflow-hidden
        whitespace-nowrap normal-case
      `}
      href="/specify/overlay/user-tools/"
      title={headerText.currentUser()}
    >
      {userInformation.name}
    </Link.Small>
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
