import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useCachedState } from '../../hooks/useCachedState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { mainText } from '../../localization/main';
import { StringToJsx } from '../../localization/utils';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { legacyLoadingContext } from '../Core/Contexts';
import { Dialog } from '../Molecules/Dialog';
import { downloadFile } from '../Molecules/FilePicker';
import { userPreferences } from '../Preferences/userPreferences';
import {
  SetUnloadProtectsContext,
  UnloadProtectsContext,
} from '../Router/Router';
import { clearCache } from '../RouterCommands/CacheBuster';

const supportEmail = 'support@specifysoftware.org' as LocalizedString;
export const supportLink = (
  <Link.NewTab href={`mailto:${supportEmail}`} rel="noreferrer">
    {supportEmail}
  </Link.NewTab>
);
const errors = new Set<string>();

const errorBody = (
  <p>
    <StringToJsx
      components={{ email: supportLink }}
      string={mainText.errorResolutionDescription()}
    />
    <br />
    <br />
    <StringToJsx
      components={{
        memberLink: (label) => (
          <Link.NewTab href="https://www.specifysoftware.org/members/#:~:text=Members%20can%20contact%20support%40specifysoftware.org%20for%20assistance%20updating.">
            {label}
          </Link.NewTab>
        ),
        discourseLink: (label) => (
          <Link.NewTab href="https://discourse.specifysoftware.org/">
            {label}
          </Link.NewTab>
        ),
      }}
      string={mainText.errorResolutionSecondDescription()}
    />
  </p>
);

export function ErrorDialog({
  header = mainText.errorOccurred(),
  children,
  copiableMessage,
  // Error dialog is only closable in Development
  onClose: handleClose,
  dismissible = false,
}: {
  readonly children: React.ReactNode;
  readonly copiableMessage: string;
  readonly header?: LocalizedString;
  readonly onClose?: () => void;
  readonly dismissible?: boolean;
}): JSX.Element {
  const id = useId('error-dialog')('');
  // If there is more than one error, all but the last one should be dismissible
  const isLastError = React.useRef(errors.size === 0).current;
  React.useEffect(() => {
    errors.add(id);
    return (): void => void errors.delete(id);
  }, [id]);

  const [canDismiss] = userPreferences.use(
    'general',
    'application',
    'allowDismissingErrors'
  );
  const canClose =
    (canDismiss ||
      dismissible ||
      process.env.NODE_ENV === 'development' ||
      !isLastError) &&
    typeof handleClose === 'function';
  const [clearCacheOnException = false, setClearCache] = useCachedState(
    'general',
    'clearCacheOnException'
  );

  const unloadProtects = React.useContext(UnloadProtectsContext)!;
  const setUnloadProtects = React.useContext(SetUnloadProtectsContext)!;
  /**
   * Clear unload protects when error occurs, but return them back if error
   * is dismissed
   */
  const initialUnloadProtects = React.useRef(unloadProtects);
  React.useCallback(() => setUnloadProtects?.([]), [setUnloadProtects]);

  return (
    <Dialog
      buttons={
        <>
          <Button.Blue
            onClick={(): void =>
              void downloadFile(
                /*
                 * Even though the file is in a JSON format, the `.txt` file
                 * extension is used since `.json` files can't be attached to
                 * a GitHub issue (I know, that's crazy). Alternative solution
                 * is to create a `.zip` archive with a `.json` file instead,
                 * but that would require some giant zipping library.
                 */
                `Specify 7 Crash Report - ${new Date().toJSON()}.txt`,
                copiableMessage
              )
            }
          >
            {commonText.downloadErrorMessage()}
          </Button.Blue>
          <span className="-ml-2 flex-1" />
          <Label.Inline>
            <Input.Checkbox
              checked={clearCacheOnException}
              onValueChange={setClearCache}
            />
            {headerText.clearCache()}
          </Label.Inline>
          <Button.Red
            onClick={(): void =>
              legacyLoadingContext(
                (clearCacheOnException
                  ? clearCache()
                  : Promise.resolve(undefined)
                ).then(() => globalThis.location.assign('/specify/'))
              )
            }
          >
            {commonText.goToHomepage()}
          </Button.Red>
          {canClose && (
            <Button.Blue
              onClick={(): void => {
                setUnloadProtects?.(
                  initialUnloadProtects.current.length === 0
                    ? unloadProtects
                    : initialUnloadProtects.current
                );
                handleClose();
              }}
            >
              {commonText.dismiss()}
            </Button.Blue>
          )}
        </>
      }
      forceToTop
      header={header}
      onClose={undefined}
    >
      <p>
        {mainText.errorOccurredDescription()}{' '}
        {!canClose && mainText.criticalErrorOccurredDescription()}
      </p>
      <br />
      {errorBody}
      <details
        className="flex-1 whitespace-pre-wrap"
        open={process.env.NODE_ENV === 'development'}
      >
        <summary>{mainText.errorMessage()}</summary>
        {children}
      </details>
    </Dialog>
  );
}
