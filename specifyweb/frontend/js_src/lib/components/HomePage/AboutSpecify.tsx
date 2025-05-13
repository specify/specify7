import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { StringToJsx } from '../../localization/utils';
import { welcomeText } from '../../localization/welcome';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import { fetchCollection } from '../DataModel/collection';
import { tables } from '../DataModel/tables';
import { supportLink } from '../Errors/ErrorDialog';
import { produceStackTrace } from '../Errors/stackTrace';
import { getSystemInfo } from '../InitialContext/systemInfo';
import { DateElement } from '../Molecules/DateElement';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { downloadFile } from '../Molecules/FilePicker';
import { hasTablePermission } from '../Permissions/helpers';
import { OverlayContext } from '../Router/Router';

export function AboutOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  return <AboutDialog isOpen onClose={handleClose} />;
}

const websiteUrl = 'www.specifysoftware.org' as LocalizedString;

function AboutDialog({
  isOpen,
  onClose: handleClose,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  return (
    <Dialog
      buttons={
        <>
          <Button.Success
            onClick={(): void =>
              loading(
                downloadFile(
                  `Specify 7 System Information - ${new Date().toJSON()}.txt`,
                  produceStackTrace(
                    `System Information report. Generated on ${new Date().toJSON()}`
                  )
                )
              )
            }
          >
            {welcomeText.downloadInformation()}
          </Button.Success>
          {/* REFACTOR: replace span elements like this with a separator */}
          <span className="-ml-2 flex-1" />
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        </>
      }
      className={{
        container: `${dialogClassNames.normalContainer} w-[min(30rem,90%)]`,
        content: `${dialogClassNames.flexContent} pr-4`,
        header: 'text-3xl',
      }}
      header={welcomeText.aboutSpecify()}
      icon="info"
      isOpen={isOpen}
      onClose={handleClose}
    >
      <p>
        <b>
          <StringToJsx
            components={{
              br: <br />,
            }}
            string={welcomeText.fullAddress()}
          />
        </b>
      </p>
      <address>
        <p>
          <Link.NewTab href="https://specifysoftware.org" rel="noreferrer">
            {websiteUrl}
          </Link.NewTab>
        </p>
        <p>{supportLink}</p>
      </address>
      <p className="text-justify">{welcomeText.disclosure()}</p>
      <p className="text-justify">{welcomeText.licence()}</p>

      <section>
        <H3>{welcomeText.systemInformation()}</H3>
        <table className="grid-table grid-cols-[auto,auto] gap-1">
          <tbody>
            {[
              [welcomeText.specifyVersion(), getSystemInfo().version],
              [welcomeText.gitSha(), <GitSha key="git-sha" />],
              [welcomeText.buildDate(), <BuildDate key="build-date" />],
              [
                welcomeText.specifySixVersion(),
                getSystemInfo().specify6_version,
              ],
              [welcomeText.databaseVersion(), getSystemInfo().database_version],
              [
                `${welcomeText.schemaVersion()}:`,
                <Link.Default href="/specify/datamodel/" key="link">
                  {getSystemInfo().schema_version}
                </Link.Default>,
              ],
              [welcomeText.databaseName(), getSystemInfo().database],
              ...(hasTablePermission('SpVersion', 'read')
                ? [
                    [
                      welcomeText.databaseCreationDate(),
                      <DatabaseCreationDate key="" />,
                    ],
                  ]
                : []),
              [
                commonText.colonHeader({ header: tables.Institution.label }),
                getSystemInfo().institution,
              ],
              [
                commonText.colonHeader({ header: tables.Discipline.label }),
                getSystemInfo().discipline,
              ],
              [
                commonText.colonHeader({ header: tables.Collection.label }),
                getSystemInfo().collection,
              ],
              [
                welcomeText.isaNumber(),
                getSystemInfo().isa_number ?? commonText.notApplicable(),
              ],
              [welcomeText.browser(), globalThis.navigator.userAgent],
            ].map(([label, value], index) => (
              <tr key={index}>
                <th className="justify-end whitespace-nowrap" scope="row">
                  {label}
                </th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Dialog>
  );
}

function DatabaseCreationDate(): JSX.Element {
  const [date] = useAsyncState(
    React.useCallback(
      async () =>
        fetchCollection('SpVersion', { limit: 1, domainFilter: false }).then(
          ({ records }) => records[0]?.timestampCreated
        ),
      []
    ),
    false
  );
  return <DateElement date={date} fallback={commonText.loading()} flipDates />;
}

function GitSha(): JSX.Element {
  const [gitSha] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<LocalizedString>('/static/git_sha.txt', {
          headers: {
            accept: 'text/plain',
          },
          errorMode: 'dismissible',
          expectedErrors: [Http.NOT_FOUND],
        }).then(({ data, status }) =>
          status === Http.NOT_FOUND ? false : data
        ),
      []
    ),
    false
  );
  return (
    <>
      {gitSha === false ? (
        commonText.unknown()
      ) : typeof gitSha === 'string' ? (
        <Link.NewTab
          className="break-all"
          href={`https://github.com/specify/specify7/commit/${gitSha}`}
        >
          {gitSha}
        </Link.NewTab>
      ) : (
        commonText.loading()
      )}
    </>
  );
}

function BuildDate(): JSX.Element {
  const [buildDate] = useAsyncState(
    React.useCallback(
      async () =>
        ajax('/static/build_date.txt', {
          headers: {
            accept: 'text/plain',
          },
          errorMode: 'dismissible',
          expectedErrors: [Http.NOT_FOUND],
        }).then(({ data, status }) =>
          status === Http.NOT_FOUND ? commonText.unknown() : data
        ),
      []
    ),
    false
  );
  return <DateElement date={buildDate} fallback={commonText.loading()} />;
}
