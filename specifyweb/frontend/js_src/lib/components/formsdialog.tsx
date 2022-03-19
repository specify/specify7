import React from 'react';

import { ajax } from '../ajax';
import type { Tables } from '../datamodel';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { getView } from '../parseform';
import { getResourceViewUrl } from '../resource';
import { fetchContext as fetchSchema, getModel } from '../schema';
import { SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { defined } from '../types';
import { className, Link, Ul } from './basic';
import { TableIcon } from './common';
import { useAsyncState } from './hooks';
import { Dialog, dialogClassNames, LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';

type Entry = {
  iconName: keyof Tables | undefined;
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
    views.map(async (view) =>
      getView(view.getAttribute('view') ?? '').then<Entry>(
        (form: { readonly class: string }) => {
          const modelName = SpecifyModel.parseClassName(
            form.class
          ) as keyof Tables;
          const model = defined(getModel(modelName));

          return {
            iconName:
              (view.getAttribute('iconname') as keyof Tables | null) ??
              undefined,
            viewUrl: getResourceViewUrl(modelName),
            title: view.getAttribute('title') ?? '',
            model,
          };
        }
      )
    )
  );
});

const fetchForms = async (): Promise<RA<Entry>> => getFormsPromise;

export function FormsDialog({
  onSelected: handleSelected,
  onClose: handleClose,
}: {
  readonly onSelected?: (model: SpecifyModel) => void;
  readonly onClose: () => void;
}): JSX.Element {
  const [forms] = useAsyncState(fetchForms);

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
                    ? className.navigationHandled
                    : undefined
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
                {typeof iconName === 'string' && (
                  <TableIcon name={iconName} tableLabel={false} />
                )}
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
