import React from 'react';

import commonText from '../localization/common';
import welcomeText from '../localization/welcome';
import { getBoolPref, getPref } from '../remoteprefs';
import { getSystemInfo } from '../systeminfo';
import taxonTiles from '../taxontiles';
import { Button, H3, Link } from './basic';
import { supportLink } from './errorboundary';
import { useBooleanState, useTitle } from './hooks';
import { Dialog, dialogClassNames } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { UserTool } from './main';

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

function AboutDialog({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      title={welcomeText('aboutSpecifyDialogTitle')}
      header={commonText('specifySeven')}
      className={{
        container: `${dialogClassNames.normalContainer} w-[min(30rem,90%)]`,
        header: 'text-3xl',
      }}
      onClose={handleClose}
      buttons={commonText('close')}
    >
      <p>{welcomeText('fullAddress')}</p>
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
        <table className="grid-table gap-1 grid-cols-[auto,auto]">
          <tbody>
            {[
              [welcomeText('version'), getSystemInfo().version],
              [
                welcomeText('specifySixVersion'),
                getSystemInfo().specify6_version,
              ],
              [
                welcomeText('databaseVersion'),
                getSystemInfo().database_version,
              ],
              [welcomeText('schemaVersion'), getSystemInfo().schema_version],
              [welcomeText('databaseName'), getSystemInfo().database],
              [welcomeText('institution'), getSystemInfo().institution],
              [welcomeText('discipline'), getSystemInfo().discipline],
              [welcomeText('collection'), getSystemInfo().collection],
              [
                welcomeText('isaNumber'),
                getSystemInfo().isa_number ?? commonText('notApplicable'),
              ],
              [welcomeText('browser'), window.navigator.userAgent],
            ].map(([label, value], index) => (
              <tr key={index}>
                <th scope="row" className="whitespace-nowrap justify-end">
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

function AboutSpecify(): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <div className="text-right">
      <Button.LikeLink title={welcomeText('aboutSpecify')} onClick={handleOpen}>
        <img
          src="/static/img/specify_7_small.png"
          alt={welcomeText('aboutSpecify')}
        />
      </Button.LikeLink>
      {isOpen && <AboutDialog onClose={handleClose} />}
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
const View = createBackboneView(AboutDialog);

export const userTool: UserTool = {
  task: 'about',
  title: welcomeText('aboutSpecify'),
  view: ({ onClose }) => new View({ onClose }),
  isOverlay: true,
  groupLabel: commonText('documentation'),
};
