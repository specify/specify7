import React from 'react';

import { ajax } from '../ajax';
import type { Tables } from '../datamodel';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { getView } from '../parseform';
import { getAttribute } from '../parseformcells';
import { hasTablePermission } from '../permissions';
import { getResourceViewUrl } from '../resource';
import { fetchContext as fetchSchema, getModel } from '../schema';
import { SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { defined } from '../types';
import { className, Link, Ul } from './basic';
import { TableIcon } from './common';
import { Dialog, dialogClassNames } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { cachableUrl } from '../initialcontext';
import { useAsyncState } from './hooks';
import { f } from '../wbplanviewhelper';

export type FormEntry = {
  iconName: keyof Tables | undefined;
  viewUrl: string;
  title: string;
  table: keyof Tables;
};

const url = cachableUrl('/context/app.resource?name=DataEntryTaskInit');
const fetchForms = f.store(
  async (): Promise<RA<FormEntry>> =>
    ajax<Document>(url, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Accept: 'application/xml' },
    }).then(async ({ data }) => {
      await fetchSchema;
      return Promise.all(
        Array.from(data.getElementsByTagName('view'))
          // I don't think the non-sidebar items are ever used in Sp6.
          .filter((item) => getAttribute(item, 'sideBar') === 'true')
          .map(async (view) =>
            getView(getAttribute(view, 'view') ?? '').then<FormEntry>(
              (form: { readonly class: string }) => {
                const modelName = SpecifyModel.parseClassName(
                  form.class
                ) as keyof Tables;
                const model = defined(getModel(modelName));

                return {
                  iconName:
                    (getAttribute(view, 'iconName') as
                      | keyof Tables
                      | undefined) ??
                    model.name ??
                    undefined,
                  viewUrl: getResourceViewUrl(modelName),
                  title: getAttribute(view, 'title') ?? '',
                  table: model.name,
                };
              }
            )
          )
      );
    })
);

export function FormsDialog({
  onSelected: handleSelected,
  onClose: handleClose,
}: {
  readonly onSelected?: (model: SpecifyModel) => void;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [forms] = useAsyncState(fetchForms, true);

  return Array.isArray(forms) ? (
    <Dialog
      header={formsText('formsDialogTitle')}
      className={{ container: dialogClassNames.narrowContainer }}
      buttons={commonText('cancel')}
      onClose={handleClose}
    >
      <nav>
        <Ul>
          {forms
            .filter(({ table }) => hasTablePermission(table, 'create'))
            .map(({ iconName, title, viewUrl, table }, index) => (
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
                          handleSelected(defined(getModel(table)));
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
  ) : null;
}

export default createBackboneView(FormsDialog);
