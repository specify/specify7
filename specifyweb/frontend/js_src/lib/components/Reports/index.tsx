import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { reportsText } from '../../localization/report';
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
import { schema } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { SpAppResource, SpQuery, SpReport } from '../DataModel/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { cachableUrl } from '../InitialContext';
import { DateElement } from '../Molecules/DateElement';
import { Dialog } from '../Molecules/Dialog';
import { FormattedResourceUrl } from '../Molecules/FormattedResource';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import { TableIcon } from '../Molecules/TableIcon';
import { formatUrl } from '../Router/queryString';
import { OverlayContext } from '../Router/Router';
import { Report } from './Report';

export const reportsAvailable = ajax<{ readonly available: boolean }>(
  cachableUrl('/context/report_runner_status.json'),
  {
    headers: { Accept: 'application/json' },
  },
  { strict: false }
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

export type ReportEntry = {
  readonly appResource: SerializedResource<SpAppResource>;
  readonly report: SerializedResource<SpReport> | undefined;
  readonly query: SerializedResource<SpQuery> | undefined;
};

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
  const [resources] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<{
          readonly objects: RA<{
            readonly app_resource: SerializedModel<SpAppResource>;
            readonly report: SerializedModel<SpReport> | null;
            readonly query: SerializedModel<SpQuery> | null;
          }>;
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
            objects.map<ReportEntry>((entry) => ({
              appResource: serializeResource(entry.app_resource),
              report: f.maybe(entry.report ?? undefined, serializeResource),
              query: f.maybe(entry.query ?? undefined, serializeResource),
            })),
            ({ appResource }) =>
              appResource.mimeType?.includes('report') === true
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
        Array.isArray(resources) &&
        resources.flat().length === 1
          ? resources.flat()[0]
          : undefined,
      [autoSelectSingle, resources]
    )
  );

  const [attachmentSettings = false] = useAsyncState(
    fetchAttachmentSettings,
    true
  );

  const [labels, reports] = resources ?? [[], []];

  return typeof resources === 'object' && attachmentSettings ? (
    typeof selectedReport === 'object' ? (
      <ErrorBoundary dismissible>
        <Report
          model={model}
          resource={selectedReport}
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
            <div className="flex items-center gap-2">
              <h2>{reportsText.reports()}</h2>
            </div>
            <ReportRow
              cacheKey="listOfReports"
              fallbackIcon="Reports"
              resources={reports}
              onClick={setSelectedReport}
            />
          </section>
          <section>
            <div className="flex items-center gap-2">
              <h2>{reportsText.labels()}</h2>
            </div>
            <ReportRow
              cacheKey="listOfLabels"
              resources={labels}
              fallbackIcon="Labels"
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
  cacheKey,
  fallbackIcon,
  onClick: handleClick,
}: {
  readonly resources: RA<ReportEntry>;
  readonly cacheKey: 'listOfLabels' | 'listOfReports';
  readonly fallbackIcon: 'Labels' | 'Reports';
  readonly onClick: (resource: ReportEntry) => void;
}): JSX.Element {
  const [sortConfig, handleSort, applySortConfig] = useSortConfig(
    cacheKey,
    'name'
  );
  const resources = React.useMemo(
    () =>
      applySortConfig(
        unsortedResources,
        ({ appResource }) => appResource[sortConfig.sortField]
      ),
    [sortConfig, unsortedResources]
  );

  return resources.length === 0 ? (
    <p>{commonText.noResults()}</p>
  ) : (
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
        {resources.map((entry) => (
          <tr key={entry.appResource.id}>
            <td>
              <Button.LikeLink
                className="flex-1"
                title={entry.appResource.description ?? undefined}
                onClick={(): void => handleClick(entry)}
              >
                <TableIcon
                  label
                  name={entry.query?.contextName ?? fallbackIcon}
                />
                {entry.appResource.name}
              </Button.LikeLink>
            </td>
            <td>
              <DateElement date={entry.appResource.timestampCreated} />
            </td>
            <td>
              <FormattedResourceUrl
                resourceUrl={entry.appResource.specifyUser}
              />
            </td>
            <td>
              <Link.Icon
                aria-label={commonText.edit()}
                href={`/specify/resources/app-resource/${entry.appResource.id}/`}
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
