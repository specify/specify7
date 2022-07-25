import React from 'react';

import { fetchCollection } from '../collection';
import { commonText } from '../localization/common';
import { welcomeText } from '../localization/welcome';
import { hasTablePermission } from '../permissionutils';
import { schema } from '../schema';
import { getSystemInfo } from '../systeminfo';
import { Button, H3, Link } from './basic';
import { supportLink } from './errorboundary';
import { useAsyncState, useBooleanState } from './hooks';
import { DateElement } from './internationalization';
import { Dialog, dialogClassNames } from './modaldialog';
import { usePref } from './preferenceshooks';
import { defaultWelcomePageImage } from './preferencesrenderers';
import { OverlayContext } from './router';
import { TaxonTiles } from './taxontiles';

function WelcomeScreenContent(): JSX.Element {
  const [mode] = usePref('welcomePage', 'general', 'mode');
  const [source] = usePref('welcomePage', 'general', 'source');

  return mode === 'embeddedWebpage' ? (
    <iframe
      className="h-full w-full border-0"
      src={source}
      title={welcomeText('pageTitle')}
    />
  ) : (
    <img
      alt=""
      className="h-full"
      src={mode === 'default' ? defaultWelcomePageImage : source}
    />
  );
}

export function AboutOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  return <AboutDialog isOpen onClose={handleClose} />;
}

function AboutDialog({
  isOpen,
  onClose: handleClose,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={commonText('close')}
      className={{
        container: `${dialogClassNames.normalContainer} w-[min(30rem,90%)]`,
        content: `${dialogClassNames.flexContent} pr-4`,
        header: 'text-3xl',
      }}
      header={welcomeText('aboutSpecify')}
      isOpen={isOpen}
      onClose={handleClose}
    >
      <p>
        <b>{welcomeText('fullAddress')}</b>
      </p>
      <address>
        <p>
          <Link.NewTab href="https://specifysoftware.org" rel="noreferrer">
            www.specifysoftware.org
          </Link.NewTab>
        </p>
        <p>{supportLink}</p>
      </address>
      <p className="text-justify">{welcomeText('disclosure')}</p>
      <p className="text-justify">{welcomeText('licence')}</p>

      <section>
        <H3>{welcomeText('systemInformation')}</H3>
        <table className="grid-table grid-cols-[auto,auto] gap-1">
          <tbody>
            {[
              [welcomeText('specifyVersion'), getSystemInfo().version],
              [
                welcomeText('specifySixVersion'),
                getSystemInfo().specify6_version,
              ],
              [
                welcomeText('databaseVersion'),
                getSystemInfo().database_version,
              ],
              [
                welcomeText('schemaVersion'),
                <Link.Default href="/specify/datamodel/" key="link">
                  {getSystemInfo().schema_version}
                </Link.Default>,
              ],
              [welcomeText('databaseName'), getSystemInfo().database],
              ...(hasTablePermission('SpVersion', 'read')
                ? [
                    [
                      welcomeText('databaseCreationDate'),
                      <DatabaseCreationDate key="" />,
                    ],
                  ]
                : []),
              [
                `${schema.models.Institution.label}:`,
                getSystemInfo().institution,
              ],
              [
                `${schema.models.Discipline.label}:`,
                getSystemInfo().discipline,
              ],
              [
                `${schema.models.Collection.label}: `,
                getSystemInfo().collection,
              ],
              [
                welcomeText('isaNumber'),
                getSystemInfo().isa_number ?? commonText('notApplicable'),
              ],
              [welcomeText('browser'), globalThis.navigator.userAgent],
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
        fetchCollection('SpVersion', { limit: 1 }).then(
          ({ records }) => records[0]?.timestampCreated
        ),
      []
    ),
    false
  );
  return <DateElement date={date} fallback={commonText('loading')} flipDates />;
}

function AboutSpecify(): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <div className="flex-1 text-right">
      <Button.LikeLink title={welcomeText('aboutSpecify')} onClick={handleOpen}>
        <img
          alt={welcomeText('aboutSpecify')}
          src="/static/img/specify_7_small.png"
        />
      </Button.LikeLink>
      <AboutDialog isOpen={isOpen} onClose={handleClose} />
    </div>
  );
}

export function WelcomeView(): JSX.Element {
  const [mode] = usePref('welcomePage', 'general', 'mode');

  return (
    <div
      className={`
        mx-auto flex h-full max-w-[1000px] flex-col justify-center gap-4  p-4
      `}
      ref={console.log}
    >
      <span className="flex-1" />
      <div
        className={`
          flex min-h-0 items-center justify-center
          ${mode === 'embeddedWebpage' ? 'h-5/6' : ''}
        `}
      >
        {mode === 'taxonTiles' ? <TaxonTiles /> : <WelcomeScreenContent />}
      </div>
      <AboutSpecify />
    </div>
  );
}
