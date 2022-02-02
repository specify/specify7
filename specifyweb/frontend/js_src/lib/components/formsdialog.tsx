import React from 'react';

import { ajax } from '../ajax';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { fetchContext as fetchSchema, getModel } from '../schema';
import { makeResourceViewUrl } from '../specifyapi';
import specifyform from '../specifyform';
import { SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { defined } from '../types';
import { Link, Ul } from './basic';
import { TableIcon } from './common';
import { Dialog, dialogClassNames, LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { useAsyncState } from './hooks';

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
  await fetchSchema;
  // I don't think the non-sidebar items are ever used in Sp6.
  const views: RA<Element> = Array.from(
    data.getElementsByTagName('view')
  ).filter((item) => item.getAttribute('sidebar') === 'true');
  return Promise.all(
    views.map((view) =>
      specifyform
        .getView(view.getAttribute('view'))
        .then<Entry>((form: { readonly class: string }) => {
          const modelName = SpecifyModel.parseClassName(form.class);
          const model = defined(getModel(modelName));

          return {
            iconName: (view.getAttribute('iconname') ?? '').toLowerCase(),
            viewUrl: makeResourceViewUrl(modelName),
            title: view.getAttribute('title') ?? '',
            model,
          };
        })
    )
  );
});

const getForms = async (): Promise<RA<Entry>> => getFormsPromise;

function FormsDialog({
  onSelected: handleSelected,
  onClose: handleClose,
}: {
  readonly onSelected?: (model: SpecifyModel) => void;
  readonly onClose: () => void;
}): JSX.Element {
  const [forms] = useAsyncState(getForms);

  return Array.isArray(forms) ? (
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
  ) : (
    <LoadingScreen />
  );
}

export default createBackboneView(FormsDialog);
