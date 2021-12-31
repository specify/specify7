import '../../css/welcome.css';

import React from 'react';

import commonText from '../localization/common';
import welcomeText from '../localization/welcome';
import { getBoolPref, getPref } from '../remoteprefs';
import systemInfo from '../systeminfo';
import taxonTiles from '../taxontiles';
import { useTitle } from './common';
import { ModalDialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';

const DO_TAXON_TILES = getBoolPref('sp7.doTaxonTiles', false);
const defaultWelcomeScreenImage = '/static/img/icons_as_background_small.png';
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
    <iframe title={welcomeText('pageTitle')} src={welcomeScreenUrl} />
  ) : (
    <img src={welcomeScreenUrl} alt="" />
  );
}

function AboutSpecify(): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="welcome-footer">
      <button
        type="button"
        title={welcomeText('aboutSpecify')}
        className="fake-link"
        onClick={(): void => setIsOpen(true)}
      >
        <img
          src="/static/img/specify_7_small.png"
          alt={welcomeText('aboutSpecify')}
        />
      </button>
      {isOpen && (
        <ModalDialog
          properties={{
            title: welcomeText('aboutSpecifyDialogTitle'),
            width: 400,
            close: (): void => setIsOpen(false),
          }}
        >
          <h2>{commonText('specifySeven')}</h2>
          <h3>{welcomeText('fullAddress')}</h3>
          <address>
            <p>
              <a
                href="https://specifysoftware.org"
                target="_blank"
                rel="noreferrer"
              >
                www.specifysoftware.org
                <img
                  src="/static/img/new_tab.svg"
                  alt={commonText('opensInNewTab')}
                  className="new-tab-link-icon"
                />
              </a>
            </p>
            <p>
              <a
                href="mailto:support@specifysoftware.org"
                target="_blank"
                rel="noreferrer"
              >
                support@specifysoftware.org
                <img
                  src="/static/img/new_tab.svg"
                  alt={commonText('opensInNewTab')}
                  className="new-tab-link-icon"
                />
              </a>
            </p>
          </address>
          <p style={{ textAlign: 'justify' }}>{welcomeText('disclosure')}</p>
          <p style={{ textAlign: 'justify' }}>{welcomeText('licence')}</p>

          <section id="specify-system-info">
            <h3>{welcomeText('systemInformation')}</h3>
            <table>
              <tbody>
                <tr>
                  <th scope="row">{welcomeText('version')}</th>
                  <td>{systemInfo.version}</td>
                </tr>
                <tr>
                  <th scope="row">{welcomeText('specifySixVersion')}</th>
                  <td>{systemInfo.specify6_version}</td>
                </tr>
                <tr>
                  <th scope="row">{welcomeText('databaseVersion')}</th>
                  <td>{systemInfo.database_version}</td>
                </tr>
                <tr>
                  <th scope="row">{welcomeText('schemaVersion')}</th>
                  <td>{systemInfo.schema_version}</td>
                </tr>
                <tr>
                  <th scope="row">{welcomeText('databaseName')}</th>
                  <td>{systemInfo.database}</td>
                </tr>
                <tr>
                  <th scope="row">{welcomeText('institution')}</th>
                  <td>{systemInfo.institution}</td>
                </tr>
                <tr>
                  <th scope="row">{welcomeText('discipline')}</th>
                  <td>{systemInfo.discipline}</td>
                </tr>
                <tr>
                  <th scope="row">{welcomeText('collection')}</th>
                  <td>{systemInfo.collection}</td>
                </tr>
                <tr>
                  <th scope="row">{welcomeText('isaNumber')}</th>
                  <td>
                    {systemInfo.isa_number ?? commonText('notApplicable')}
                  </td>
                </tr>
                <tr>
                  <th scope="row">{welcomeText('browser')}</th>
                  <td>{window.navigator.userAgent}</td>
                </tr>
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
    <>
      <div ref={refTaxonTilesContainer} />
      {DO_TAXON_TILES ? undefined : <WelcomeScreenContent />}
      <AboutSpecify />
    </>
  );
}

export default createBackboneView(WelcomeView, {
  className: 'specify-welcome',
});
