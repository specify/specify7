import React from 'react';

import { commonText } from '../../localization/common';
import { mainText } from '../../localization/main';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { getSystemInfo } from '../InitialContext/systemInfo';
import { Dialog } from '../Molecules/Dialog';

/**
 * A version mismatch is detected when a database created in Specify 6 does not have a matching database schema version and its last used Specify 6 version.
 * For databases created in Specify 7 this check is currently unnessecary.
 */
export function VersionMismatch(): JSX.Element | null {
  const [showVersionMismatch, setShowVersionMismatch] = React.useState(
    getSystemInfo().specify6_version !== getSystemInfo().database_version &&
      getSystemInfo().database_version !== '7'
  );
  return showVersionMismatch ? (
    <Dialog
      buttons={
        <Button.Warning onClick={(): void => setShowVersionMismatch(false)}>
          {commonText.close()}
        </Button.Warning>
      }
      forceToTop
      header={mainText.versionMismatch()}
      onClose={(): void => setShowVersionMismatch(false)}
    >
      <p>
        {mainText.versionMismatchDescription({
          specifySixVersion: getSystemInfo().specify6_version,
          databaseVersion: getSystemInfo().database_version,
        })}
      </p>
      <p>{mainText.versionMismatchSecondDescription()}</p>
      <p>
        <Link.NewTab href="https://discourse.specifysoftware.org/t/resolve-specify-7-schema-version-mismatch/884">
          {mainText.versionMismatchInstructions()}
        </Link.NewTab>
      </p>
    </Dialog>
  ) : null;
}
