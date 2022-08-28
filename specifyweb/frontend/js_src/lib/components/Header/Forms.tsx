import React from 'react';

import { ajax } from '../../utils/ajax';
import type { Tables } from '../DataModel/types';
import { f } from '../../utils/functools';
import {
  getAttribute,
  getBooleanAttribute,
  getParsedAttribute,
} from '../../utils/utils';
import { cachableUrl } from '../InitialContext';
import { commonText } from '../../localization/common';
import { fetchView } from '../FormParse';
import { hasTablePermission } from '../Permissions/helpers';
import { formatUrl } from '../Router/queryString';
import { getResourceViewUrl, parseClassName } from '../DataModel/resource';
import { fetchContext as fetchSchema, getModel } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { RA } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { TableIcon } from '../Molecules';
import { EditFormTables, useFormModels } from '../Toolbar/FormTablesEdit';
import { useAsyncState, useBooleanState } from '../../hooks/hooks';
import { icons } from '../Atoms/Icons';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';
import { DataEntry } from '../Atoms/DataEntry';
import { Ul } from '../Atoms';
import { Link } from '../Atoms/Link';

export function FormsDialogOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  return <FormsDialog onClose={handleClose} />;
}

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
  const [models] = useFormModels();
  const [rawForms] = useAsyncState(fetchLegacyForms, true);
  const forms = resolveModels(models, rawForms);
  const [isEditing, handleEditing] = useBooleanState();

  return isEditing ? (
    <EditFormTables onClose={handleClose} />
  ) : Array.isArray(forms) ? (
    <Dialog
      buttons={commonText('cancel')}
      className={{ container: dialogClassNames.narrowContainer }}
      header={commonText('dataEntry')}
      headerButtons={<DataEntry.Edit onClick={handleEditing} />}
      icon={<span className="text-blue-500">{icons.pencilAt}</span>}
      onClose={handleClose}
    >
      <nav>
        <Ul>
          {forms
            .filter(({ table }) => hasTablePermission(table, 'create'))
            .map(({ iconName, title, table }, index) => (
              <li key={index}>
                <Link.Default
                  href={getResourceViewUrl(table)}
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
                    <TableIcon label={false} name={iconName} />
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

export type FormEntry = {
  readonly iconName: string | undefined;
  readonly title: string;
  readonly table: keyof Tables;
};

const url = cachableUrl(
  formatUrl('/context/app.resource', { name: 'DataEntryTaskInit' })
);
const fetchLegacyForms = f.store(
  async (): Promise<RA<FormEntry>> =>
    ajax<Document>(url, {
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
            fetchView(getAttribute(view, 'view') ?? '').then<
              FormEntry | undefined
            >((form) => {
              if (form === undefined) return undefined;
              const modelName = parseClassName(form.class) as keyof Tables;
              const model = defined(getModel(modelName));

              return {
                iconName: getParsedAttribute(view, 'iconName') ?? model.name,
                title: getParsedAttribute(view, 'title') ?? '',
                table: model.name,
              };
            })
          )
      ).then(filterArray);
    })
);

const resolveModels = (
  models: RA<SpecifyModel> | 'legacy',
  forms: RA<FormEntry> | undefined
): RA<FormEntry> | undefined =>
  models === 'legacy'
    ? forms
    : models.map((model) => ({
        iconName: model.name,
        title: model.label,
        table: model.name,
      }));
