import React from 'react';

import ajax from '../ajax';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { getModel } from '../schema';
import { makeResourceViewUrl } from '../specifyapi';
import specifyform from '../specifyform';
import type SpecifyModel from '../specifymodel';
import type { RA } from '../types';
import { defined } from '../types';
import { Link, Ul } from './basic';
import { TableIcon } from './common';
import { Dialog, dialogClassNames, LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';

type Entry = {
  iconName: string;
  viewUrl: string;
  title: string;
  model: SpecifyModel;
};

const getFormsPromise: Promise<RA<Entry>> = ajax<Document>(
  '/context/app.resource?name=DataEntryTaskInit',
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    headers: { Accept: 'application/xml' },
  }
).then(async ({ data }) => {
  // I don't think the non-sidebar items are ever used in Sp6.
  const views: RA<Element> = Array.from(
    data.getElementsByTagName('view')
  ).filter((item) => item.getAttribute('sidebar') === 'true');
  return Promise.all(
    views.map((view) =>
      specifyform
        .getView(view.getAttribute('view'))
        .then<Entry>((form: { readonly class: string }) => {
          const modelName = form.class.split('.').slice(-1)[0];
          const model = defined(getModel(modelName));

          return {
            iconName: (view.getAttribute('iconname') ?? '').toLowerCase(),
            viewUrl: new model.Resource().viewUrl(),
            title: view.getAttribute('title') ?? '',
            model,
          };
        })
    )
  );
});

function FormsDialog({
  onSelected: handleSelected,
  onClose: handleClose,
}: {
  readonly onSelected?: (model: SpecifyModel) => void;
  readonly onClose: () => void;
}): JSX.Element {
  const [forms, setForms] = React.useState<Awaited<typeof getFormsPromise>>();

  React.useEffect(() => {
    getFormsPromise.then(setForms).catch(console.error);
  }, []);

  return typeof forms === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <Dialog
      header={formsText('formsDialogTitle')}
      className={{ container: dialogClassNames.narrowContainer }}
      buttons={commonText('cancel')}
      onClose={handleClose}
    >
      <nav>
        <Ul>
          {forms.map(({ iconName, title, viewUrl, model }, index) => (
            <li key={index}>
              <Link.Default
                href={viewUrl}
                className={
                  typeof handleSelected === 'function'
                    ? undefined
                    : 'intercept-navigation'
                }
                onClick={
                  typeof handleSelected === 'function'
                    ? (event): void => {
                        event.preventDefault();
                        handleSelected(model);
                      }
                    : undefined
                }
              >
                <TableIcon tableName={iconName} tableLabel={false} />
                {title}
              </Link.Default>
            </li>
          ))}
        </Ul>
      </nav>
    </Dialog>
  );
}

export default createBackboneView(FormsDialog);
