import React from 'react';

import commonText from '../localization/common';
import welcomeText from '../localization/welcome';
import { getBoolPref, getPref } from '../remoteprefs';
import systemInfo from '../systeminfo';
import taxonTiles from '../taxontiles';
import { ButtonLikeLink, NewTabLink } from './basic';
import { useTitle } from './hooks';
import { ModalDialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';

const DO_TAXON_TILES = getBoolPref('sp7.doTaxonTiles', false);
const defaultWelcomeScreenImage = '/static/img/icons_as_background_splash.png';
const welcomeScreenUrl = getPref(
  'sp7.welcomeScreenUrl',
  defaultWelcomeScreenImage
);

function WelcomeScreenContent(): JSX.Element {
  const [isValidUrl, setIsValidUrl] = React.useState(false);

  React.useEffect(() => {
    fetch(welcomeScreenUrl, { method: 'HEAD' })
      .then(({ headers }) =>
        setIsValidUrl(
          headers.get('Content-Type')?.startsWith('image') === false
        )
      )
      .catch(() => setIsValidUrl(false));
  }, []);

  return isValidUrl ? (
    <iframe
      className="h-5/6 border-0"
      title={welcomeText('pageTitle')}
      src={welcomeScreenUrl}
    />
  ) : (
    <img src={welcomeScreenUrl} alt="" />
  );
}

function AboutSpecify(): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="text-right">
      <ButtonLikeLink
        title={welcomeText('aboutSpecify')}
        onClick={(): void => setIsOpen(true)}
      >
        <img
          src="/static/img/specify_7_small.png"
          alt={welcomeText('aboutSpecify')}
        />
      </ButtonLikeLink>
      {isOpen && (
        <ModalDialog
          properties={{
            title: welcomeText('aboutSpecifyDialogTitle'),
            width: 400,
            close: (): void => setIsOpen(false),
          }}
        >
          <h2 className="text-3xl">{commonText('specifySeven')}</h2>
          <p>{welcomeText('fullAddress')}</p>
          <address>
            <p>
              <NewTabLink href="https://specifysoftware.org" rel="noreferrer">
                www.specifysoftware.org
              </NewTabLink>
            </p>
            <p>
              <NewTabLink
                href="mailto:support@specifysoftware.org"
                rel="noreferrer"
              >
                support@specifysoftware.org
              </NewTabLink>
            </p>
          </address>
          <p className="text-justify">{welcomeText('disclosure')}</p>
          <p className="text-justify">{welcomeText('licence')}</p>

          <section id="specify-system-info">
            <h3>{welcomeText('systemInformation')}</h3>
            <table>
              <tbody>
                {[
                  [welcomeText('version'), systemInfo.version],
                  [
                    welcomeText('specifySixVersion'),
                    systemInfo.specify6_version,
                  ],
                  [welcomeText('databaseVersion'), systemInfo.database_version],
                  [welcomeText('schemaVersion'), systemInfo.schema_version],
                  [welcomeText('databaseName'), systemInfo.database],
                  [welcomeText('institution'), systemInfo.institution],
                  [welcomeText('discipline'), systemInfo.discipline],
                  [welcomeText('collection'), systemInfo.collection],
                  [
                    welcomeText('isaNumber'),
                    systemInfo.isa_number ?? commonText('notApplicable'),
                  ],
                  [welcomeText('browser'), window.navigator.userAgent],
                ].map(([label, value], index) => (
                  <tr key={index}>
                    <th scope="row" className="whitespace-nowrap text-right">
                      {label}
                    </th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </ModalDialog>
      )}
    </div>
  );
}

function WelcomeView(): JSX.Element {
  useTitle(welcomeText('pageTitle'));

  const refTaxonTilesContainer = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (DO_TAXON_TILES && refTaxonTilesContainer.current !== null)
      taxonTiles(refTaxonTilesContainer.current);
  }, []);

  return (
    <div
      className="flex flex-col gap-y-4 h-full justify-center my-0 max-w-[1000px]
    mx-auto"
    >
      <div ref={refTaxonTilesContainer} />
      {DO_TAXON_TILES ? undefined : <WelcomeScreenContent />}
      <AboutSpecify />
    </div>
  );
}

export default createBackboneView(WelcomeView);
