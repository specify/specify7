import React from 'react';

import { commonText } from '../localization/common';
import { welcomeText } from '../localization/welcome';
import { getSystemInfo } from '../systeminfo';
import { makeTreeMap } from '../taxontiles';
import { Button, H3, Link } from './basic';
import { supportLink } from './errorboundary';
import { useBooleanState, useTitle } from './hooks';
import type { UserTool } from './main';
import { Dialog, dialogClassNames } from './modaldialog';
import { usePref } from './preferenceshooks';
import { defaultWelcomePageImage } from './preferencesrenderers';
import { createBackboneView } from './reactbackboneextend';

function WelcomeScreenContent(): JSX.Element {
  const [mode] = usePref('welcomePage', 'general', 'mode');
  const [source] = usePref('welcomePage', 'general', 'source');

  return mode === 'embeddedWebpage' ? (
    <iframe
      className="w-full h-full border-0"
      title={welcomeText('pageTitle')}
      src={source}
    />
  ) : (
    <img
      src={mode === 'default' ? defaultWelcomePageImage : source}
      alt=""
      className="h-full"
    />
  );
}

function AboutDialog({
  onClose: handleClose,
  isOpen,
}: {
  readonly onClose: () => void;
  readonly isOpen: boolean;
}): JSX.Element {
  return (
    <Dialog
      isOpen={isOpen}
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
              [commonText('institution'), getSystemInfo().institution],
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
    <div className="flex-1 text-right">
      <Button.LikeLink title={welcomeText('aboutSpecify')} onClick={handleOpen}>
        <img
          src="/static/img/specify_7_small.png"
          alt={welcomeText('aboutSpecify')}
        />
      </Button.LikeLink>
      <AboutDialog onClose={handleClose} isOpen={isOpen} />
    </div>
  );
}

function Welcome(): JSX.Element {
  useTitle(welcomeText('pageTitle'));

  const refTaxonTilesContainer = React.useRef<HTMLDivElement | null>(null);
  const [mode] = usePref('welcomePage', 'general', 'mode');

  React.useEffect(
    () =>
      mode === 'taxonTiles' && refTaxonTilesContainer.current !== null
        ? makeTreeMap(refTaxonTilesContainer.current)
        : undefined,
    [mode]
  );

  return (
    <div
      className="flex flex-col gap-y-4 h-full justify-center p-4 max-w-[1000px]
        mx-auto"
    >
      <span className="flex-1" />
      <div
        className={`flex items-center justify-center min-h-0 ${
          mode === 'embeddedWebpage' ? 'h-5/6' : ''
        }`}
      >
        <div ref={refTaxonTilesContainer} />
        {mode === 'taxonTiles' ? undefined : <WelcomeScreenContent />}
      </div>
      <AboutSpecify />
    </div>
  );
}

export const WelcomeView = createBackboneView(Welcome);
const View = createBackboneView(AboutDialog);

export const userTool: UserTool = {
  task: 'about',
  title: welcomeText('aboutSpecify'),
  view: ({ onClose }) => new View({ onClose, isOpen: true }),
  isOverlay: true,
  groupLabel: commonText('documentation'),
};
