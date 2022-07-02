import React from 'react';

import { ajax } from '../ajax';
import type { Tables } from '../datamodel';
import { f } from '../functools';
import {
  getAttribute,
  getBooleanAttribute,
  getParsedAttribute,
} from '../helpers';
import { cachableUrl } from '../initialcontext';
import { commonText } from '../localization/common';
import { getView } from '../parseform';
import { hasTablePermission } from '../permissions';
import { formatUrl } from '../querystring';
import { getResourceViewUrl, parseClassName } from '../resource';
import { fetchContext as fetchSchema, getModel } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { defined, filterArray } from '../types';
import { className, Link, Ul } from './basic';
import { TableIcon } from './common';
import { useAsyncState } from './hooks';
import { icons } from './icons';
import { Dialog, dialogClassNames } from './modaldialog';

export type FormEntry = {
  iconName: string | undefined;
  viewUrl: string;
  title: string;
  table: keyof Tables;
};

const url = cachableUrl(
  formatUrl('/context/app.resource', { name: 'DataEntryTaskInit' })
);
const fetchForms = f.store(
  async (): Promise<RA<FormEntry>> =>
    process.env.NODE_ENV === 'test'
      ? []
      : ajax<Document>(url, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'application/xml' },
        }).then(async ({ data }) => {
          await fetchSchema;
          return Promise.all(
            Array.from(
              (data.querySelector('std') ?? data).getElementsByTagName('view')
            )
              // I don't think the non-sidebar items are ever used in Sp6.
              .filter((item) => getBooleanAttribute(item, 'sideBar') ?? false)
              .map(async (view) =>
                getView(getAttribute(view, 'view') ?? '').then<
                  FormEntry | undefined
                >((form) => {
                  if (form === undefined) return undefined;
                  const modelName = parseClassName(form.class) as keyof Tables;
                  const model = defined(getModel(modelName));

                  return {
                    iconName:
                      getParsedAttribute(view, 'iconName') ?? model.name,
                    viewUrl: getResourceViewUrl(modelName),
                    title: getParsedAttribute(view, 'title') ?? '',
                    table: model.name,
                  };
                })
              )
          ).then(filterArray);
        })
);

/**
 * A dialog presenting a list of data forms
 */
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
      icon={<span className="text-blue-500">{icons.pencilAt}</span>}
      header={commonText('dataEntry')}
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
