import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { split } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { attachmentSettingsPromise } from '../Attachments/attachments';
import { getField, serializeResource } from '../DataModel/helpers';
import type {
  SerializedModel,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { SpAppResource } from '../DataModel/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { cachableUrl } from '../InitialContext';
import { DateElement } from '../Molecules/DateElement';
import { Dialog } from '../Molecules/Dialog';
import { FormattedResourceUrl } from '../Molecules/FormattedResource';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import { formatUrl } from '../Router/queryString';
import { OverlayContext } from '../Router/Router';
import { Report } from './Report';
import { reportsText } from '../../localization/report';
import { schema } from '../DataModel/schema';
import { TableIcon } from '../Molecules/TableIcon';

export const reportsAvailable = ajax<{ readonly available: boolean }>(
  cachableUrl('/context/report_runner_status.json'),
  {
    headers: { Accept: 'application/json' },
  },
  { errorMode: 'silent' }
)
  .then(({ data }) => data.available)
  .catch(() => false);

export function ReportsOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  return (
    <ReportsView
      autoSelectSingle={false}
      model={undefined}
      resourceId={undefined}
      onClose={handleClose}
    />
  );
}

const fetchAttachmentSettings = async (): Promise<true> =>
  attachmentSettingsPromise.then(f.true);

export function ReportsView({
  // If resource ID is provided, model must be too
  model,
  resourceId,
  autoSelectSingle,
  onClose: handleClose,
}: {
  readonly model: SpecifyModel | undefined;
  readonly resourceId: number | undefined;
  readonly autoSelectSingle: boolean;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [appResources] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<{
          readonly objects: RA<SerializedModel<SpAppResource>>;
        }>(
          formatUrl(
            typeof model === 'object'
              ? `/report_runner/get_reports_by_tbl/${model.tableId}/`
              : '/report_runner/get_reports/',
            {
              domainFilter: 'false',
            }
          ),
          {
            headers: { Accept: 'application/json' },
          }
        ).then(({ data: { objects } }) =>
          split(
            objects.map(serializeResource),
            (resource) => resource.mimeType?.includes('report') === true
          )
        ),
      [model]
    ),
    true
  );

  const [selectedReport, setSelectedReport] = useLiveState(
    React.useCallback(
      () =>
        // Select the first one automatically
        autoSelectSingle &&
        Array.isArray(appResources) &&
        appResources.flat().length === 1
          ? appResources.flat()[0]
          : undefined,
      [autoSelectSingle, appResources]
    )
  );

  const [attachmentSettings = false] = useAsyncState(
    fetchAttachmentSettings,
    true
  );

  const [labels, reports] = appResources ?? [[], []];

  return typeof appResources === 'object' && attachmentSettings ? (
    typeof selectedReport === 'object' ? (
      <ErrorBoundary dismissible>
        <Report
          appResource={selectedReport}
          model={model}
          resourceId={resourceId}
          onClose={handleClose}
        />
      </ErrorBoundary>
    ) : (
      <Dialog
        buttons={commonText.cancel()}
        header={reportsText.reports()}
        icon={<span className="text-blue-500">{icons.documentReport}</span>}
        onClose={handleClose}
      >
        <div className="flex flex-col gap-4">
          <section>
            <h2>{reportsText.reports()}</h2>
            <ReportRow
              cacheKey="listOfReports"
              icon={<TableIcon name="Reports" label={false} />}
              resources={reports}
              onClick={setSelectedReport}
            />
          </section>
          <section>
            <h2>{reportsText.labels()}</h2>
            <ReportRow
              cacheKey="listOfLabels"
              icon={<TableIcon name="Labels" label={false} />}
              resources={labels}
              onClick={setSelectedReport}
            />
          </section>
        </div>
      </Dialog>
    )
  ) : null;
}

function ReportRow({
  resources: unsortedResources,
  icon,
  cacheKey,
  onClick: handleClick,
}: {
  readonly resources: RA<SerializedResource<SpAppResource>>;
  readonly icon: JSX.Element;
  readonly cacheKey: 'listOfLabels' | 'listOfReports';
  readonly onClick: (resource: SerializedResource<SpAppResource>) => void;
}): JSX.Element {
  const [sortConfig, handleSort, applySortConfig] = useSortConfig(
    cacheKey,
    'name'
  );
  const resources = React.useMemo(
    () =>
      applySortConfig(
        unsortedResources,
        (record) => record[sortConfig.sortField]
      ),
    [sortConfig, unsortedResources]
  );
  return resources.length === 0 ? (
    <p>{commonText.noResults()}</p>
  ) : (
    // BUG: replace 1fr with minmax(0,1fr) everywhere where necessary
    <table className="grid-table grid-cols-[1fr_auto_auto_min-content] gap-2">
      <thead>
        <tr>
          <th>
            <Button.LikeLink onClick={(): void => handleSort('name')}>
              {getField(schema.models.SpReport, 'name').label}
              <SortIndicator fieldName="name" sortConfig={sortConfig} />
            </Button.LikeLink>
          </th>
          <th>
            <Button.LikeLink
              onClick={(): void => handleSort('timestampCreated')}
            >
              {getField(schema.models.SpReport, 'timestampCreated').label}
              <SortIndicator
                fieldName="timestampCreated"
                sortConfig={sortConfig}
              />
            </Button.LikeLink>
          </th>
          <th>{getField(schema.models.SpReport, 'createdByAgent').label}</th>
          <td />
        </tr>
      </thead>
      <tbody>
        {resources.map((resource) => (
          <tr key={resource.id}>
            <td>
              <Button.LikeLink
                className="flex-1"
                title={resource.description ?? undefined}
                onClick={(): void => handleClick(resource)}
              >
                {icon}
                {resource.name}
              </Button.LikeLink>
            </td>
            <td>
              <DateElement date={resource.timestampCreated} />
            </td>
            <td>
              <FormattedResourceUrl resourceUrl={resource.specifyUser} />
            </td>
            <td>
              <Link.Icon
                aria-label={commonText.edit()}
                href={`/specify/resources/app-resource/${resource.id}/`}
                icon="pencil"
                title={commonText.edit()}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
