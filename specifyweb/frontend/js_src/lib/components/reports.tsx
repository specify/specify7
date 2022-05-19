import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax } from '../ajax';
import { error } from '../assert';
import {
  attachmentsAvailable,
  attachmentSettingsPromise,
  formatAttachmentUrl,
} from '../attachments';
import { fetchCollection } from '../collection';
import { csrfToken } from '../csrftoken';
import type { RecordSet, SpAppResource, SpQuery, SpReport } from '../datamodel';
import type { SerializedModel, SerializedResource } from '../datamodelutils';
import { serializeResource } from '../datamodelutils';
import { f } from '../functools';
import {
  getAttribute,
  group,
  keysToLowerCase,
  replaceItem,
  replaceKey,
  split,
} from '../helpers';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { parseSpecifyProperties } from '../parseformcells';
import type { QueryField } from '../querybuilderutils';
import { parseQueryFields, unParseQueryFields } from '../querybuilderutils';
import { QueryFieldSpec } from '../queryfieldspec';
import { formatUrl } from '../querystring';
import { fetchResource, idFromUrl } from '../resource';
import { getModelById } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import type { IR, RA } from '../types';
import { defined, filterArray } from '../types';
import { userInformation } from '../userinfo';
import { AttachmentPlugin } from './attachmentplugin';
import { Button, Form, H3, Input, Label, Link, Submit, Ul } from './basic';
import { LoadingContext } from './contexts';
import { useAsyncState, useBooleanState, useId, useLiveState } from './hooks';
import { iconClassName, icons } from './icons';
import { Dialog, LoadingScreen } from './modaldialog';
import { usePref } from './preferenceshooks';
import { queryFieldFilters } from './querybuilderfieldfilter';
import { QueryFields } from './querybuilderfields';
import { RecordSetsDialog } from './recordsetsdialog';

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

  const [attachmentSettings] = useAsyncState(
    React.useCallback(async () => attachmentSettingsPromise.then(f.true), []),
    true
  );

  const [labels, reports] = appResources ?? [[], []];

  return typeof appResources === 'object' && attachmentSettings === true ? (
    typeof selectedReport === 'object' ? (
      <Report
        appResource={selectedReport}
        onClose={handleClose}
        resourceId={resourceId}
        model={model}
      />
    ) : (
      <Dialog
        icon={<span className="text-blue-500">{icons.documentReport}</span>}
        header={commonText('reports')}
        onClose={handleClose}
        buttons={commonText('cancel')}
      >
        <section>
          <h2>{commonText('reports')}</h2>
          <Entries
            resources={reports}
            icon="/images/Reports16x16.png"
            onClick={setSelectedReport}
          />
        </section>
        <section>
          <h2>{commonText('labels')}</h2>
          <Entries
            resources={labels}
            icon="/images/Label16x16.png"
            onClick={setSelectedReport}
          />
        </section>
      </Dialog>
    )
  ) : null;
}

function Entries({
  resources,
  icon,
  onClick: handleClick,
}: {
  readonly resources: RA<SerializedResource<SpAppResource>>;
  readonly icon: string;
  readonly onClick: (resource: SerializedResource<SpAppResource>) => void;
}): JSX.Element {
  return (
    <nav className="flex flex-col gap-2">
      {resources.length === 0 ? (
        <p>{commonText('noResults')}</p>
      ) : (
        resources.map((resource) => (
          <div className="flex gap-2" key={resource.id}>
            <Button.LikeLink
              title={resource.description ?? undefined}
              onClick={(): void => handleClick(resource)}
              className="flex-1"
            >
              <img src={icon} alt="" className={iconClassName} />
              {resource.name}
            </Button.LikeLink>
            <Link.Icon
              icon="pencil"
              href={`/specify/appresources/${resource.id}/`}
              aria-label={commonText('edit')}
              title={commonText('edit')}
            />
          </div>
        ))
      )}
    </nav>
  );
}

function Report({
  appResource,
  resourceId,
  model,
  onClose: handleClose,
}: {
  readonly appResource: SerializedResource<SpAppResource>;
  readonly resourceId: number | undefined;
  readonly model: SpecifyModel | undefined;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [definition] = useAsyncState(
    React.useCallback(
      async () =>
        fetchCollection('SpAppResourceData', {
          limit: 1,
          spAppResource: appResource.id,
        }).then(({ records }) =>
          new window.DOMParser().parseFromString(
            defined(records[0].data ?? undefined),
            'text/xml'
          )
        ),
      [appResource]
    ),
    true
  );

  const [report] = useAsyncState<
    SerializedResource<SpReport> | undefined | false
  >(
    React.useCallback(
      async () =>
        fetchCollection('SpReport', {
          limit: 1,
          appResource: appResource.id,
        }).then(({ records }) => records[0] ?? false),
      [appResource]
    ),
    false
  );
  const [query] = useAsyncState(
    React.useCallback(
      () =>
        typeof report === 'object'
          ? f.maybe(idFromUrl(report.query), (id) =>
              fetchResource('SpQuery', id).then((resource) => resource ?? false)
            ) ?? false
          : undefined,
      [report]
    ),
    false
  );

  const [runCount, setRunCount] = React.useState(0);
  const [missingAttachments, setMissingAttachments] = useAsyncState(
    React.useCallback(
      () => f.maybe(definition, fixupImages),
      [definition, runCount]
    ),
    true
  );
  return query === false ? (
    <Dialog
      icon={<span className="text-blue-500">{icons.documentReport}</span>}
      header={formsText('missingReportQueryDialogHeader')}
      buttons={commonText('close')}
      onClose={handleClose}
    >
      {formsText('missingReportQueryDialogText')}
    </Dialog>
  ) : report === false ? (
    <Dialog
      icon={<span className="text-blue-500">{icons.documentReport}</span>}
      header={formsText('missingReportDialogHeader')}
      buttons={commonText('close')}
      onClose={handleClose}
    >
      {formsText('missingReportDialogText')}
    </Dialog>
  ) : Array.isArray(missingAttachments) && typeof definition === 'object' ? (
    missingAttachments.length === 0 ? (
      <ParametersDialog
        definition={definition}
        query={typeof query === 'object' ? query : undefined}
        appResource={appResource}
        resourceId={resourceId}
        model={model}
        onClose={handleClose}
      />
    ) : (
      <FixImagesDialog
        missingAttachments={missingAttachments}
        onIgnore={(): void => setMissingAttachments([])}
        onRefresh={(): void => setRunCount(runCount + 1)}
        onClose={handleClose}
      />
    )
  ) : null;
}

async function fixupImages(definition: Document): Promise<RA<string>> {
  const fileNames = Object.fromEntries(
    group(
      filterArray(
        Array.from(definition.querySelectorAll('imageExpression'), (image) =>
          f.var(
            image.classList.contains('java.net.URL')
              ? undefined
              : image.textContent
                  ?.match(
                    /\$P\{\s*RPT_IMAGE_DIR\s*\}\s*\+\s*"\/"\s*\+\s*"(.*?)"/
                  )
                  ?.slice(1)?.[0] ?? undefined,
            (match) => (typeof match === 'string' ? [match, image] : undefined)
          )
        )
      )
    )
  );
  const attachments = await fetchCollection(
    'Attachment',
    {
      limit: 0,
    },
    {
      title__in: Object.keys(fileNames).join(','),
    }
  ).then(({ records }) => records);
  const indexedAttachments = Object.fromEntries(
    attachments.map((record) => [record.title ?? '', record])
  );

  const missingAttachments: string[] = [];
  const badImageUrl = `"${window.location.origin}/images/unknown.png"`;
  Object.entries(fileNames).forEach(([fileName, imageExpressions]) => {
    const attachment = indexedAttachments[fileName];
    const imageUrl =
      typeof attachment === 'object' && attachmentsAvailable()
        ? `"${defined(formatAttachmentUrl(attachment, undefined))}"`
        : badImageUrl;
    if (typeof attachment === 'undefined') missingAttachments.push(fileName);
    imageExpressions.forEach((image) => {
      image.textContent = imageUrl;
    });
  });
  return missingAttachments;
}

function FixImagesDialog({
  missingAttachments,
  onIgnore: handleIgnore,
  onRefresh: handleRefresh,
  onClose: handleClose,
}: {
  readonly missingAttachments: RA<string>;
  readonly onIgnore: () => void;
  readonly onRefresh: () => void;
  readonly onClose: () => void;
}): JSX.Element {
  const [index, setIndex] = React.useState<number | undefined>(undefined);

  const loading = React.useContext(LoadingContext);
  return typeof index === 'undefined' ? (
    <Dialog
      icon={<span className="text-blue-500">{icons.documentReport}</span>}
      header={formsText('reportProblemsDialogTitle')}
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Button.Orange onClick={handleIgnore}>
            {commonText('ignore')}
          </Button.Orange>
        </>
      }
    >
      {formsText('reportsProblemsDialogText')}
      <H3>{formsText('missingAttachments')}</H3>
      <Ul>
        {missingAttachments.map((fileName) => (
          <Button.LikeLink
            key={fileName}
            aria-label={formsText('fix')}
            title={formsText('fix')}
          >
            {fileName}
          </Button.LikeLink>
        ))}
      </Ul>
    </Dialog>
  ) : (
    <Dialog
      icon={<span className="text-blue-500">{icons.documentReport}</span>}
      header={formsText('missingAttachmentsFixDialogTitle')}
      onClose={(): void => setIndex(undefined)}
      buttons={commonText('cancel')}
    >
      <AttachmentPlugin
        resource={undefined}
        mode="edit"
        onUploadComplete={(attachment): void =>
          loading(
            attachment
              .set('title', missingAttachments[index])
              .save()
              .then(handleRefresh)
          )
        }
      />
    </Dialog>
  );
}

function ParametersDialog({
  definition,
  query,
  appResource,
  resourceId,
  model,
  onClose: handleClose,
}: {
  readonly definition: Document;
  readonly query: SerializedResource<SpQuery> | false | undefined;
  readonly appResource: SerializedResource<SpAppResource>;
  readonly resourceId: number | undefined;
  readonly model: SpecifyModel | undefined;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [parameters, setParameters] = useLiveState(
    React.useCallback(
      () =>
        Object.fromEntries(
          filterArray(
            Array.from(
              definition.querySelectorAll('parameter[isForPrompting="true"]'),
              (parameter) => getAttribute(parameter, 'name')
            )
          ).map((name) => [name, ''])
        ),
      [definition]
    )
  );

  const [isSubmitted, handleSubmitted] = useBooleanState(
    Object.values(parameters).length === 0
  );

  const id = useId('report-parameters');
  return isSubmitted ? (
    typeof query === 'object' ? (
      typeof resourceId === 'number' && typeof model === 'object' ? (
        <ReportForRecord
          query={query}
          parameters={parameters}
          definition={definition}
          model={model}
          resourceId={resourceId}
          onClose={handleClose}
        />
      ) : (
        <RecordSets
          query={query}
          parameters={parameters}
          definition={definition}
          appResource={appResource}
          onClose={handleClose}
        />
      )
    ) : (
      <LoadingScreen />
    )
  ) : (
    <Dialog
      icon={<span className="text-blue-500">{icons.documentReport}</span>}
      header={formsText('reportParameters')}
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Submit.Green form={id('form')}>{commonText('save')}</Submit.Green>
        </>
      }
    >
      <Form id={id('form')} onSubmit={handleSubmitted}>
        {Object.entries(parameters).map(([name, value]) => (
          <Label.Generic key={name}>
            {name}
            <Input.Text
              value={value}
              autoComplete="on"
              spellCheck
              onValueChange={(value): void =>
                setParameters(replaceKey(parameters, name, value))
              }
            />
          </Label.Generic>
        ))}
      </Form>
    </Dialog>
  );
}

function ReportForRecord({
  query: rawQuery,
  parameters,
  definition,
  model,
  resourceId,
  onClose: handleClose,
}: {
  readonly query: SerializedResource<SpQuery>;
  readonly definition: Document;
  readonly parameters: IR<string>;
  readonly model: SpecifyModel;
  readonly resourceId: number;
  readonly onClose: () => void;
}): JSX.Element {
  const [clearQueryFilters] = usePref(
    'reports',
    'behavior',
    'clearQueryFilters'
  );
  const query = React.useMemo(() => {
    const query = replaceKey(
      rawQuery,
      'fields',
      rawQuery.fields.map((field) =>
        field.alwaysFilter === true
          ? field
          : {
              ...field,
              operStart:
                clearQueryFilters && field.startValue === ''
                  ? queryFieldFilters.any.id
                  : field.operStart,
              startValue: clearQueryFilters ? '' : field.startValue,
              operEnd: null,
              endValue: null,
            }
      )
    );
    const newField = QueryFieldSpec.fromPath([model.name, model.idField.name])
      .toSpQueryField()
      .set('operStart', queryFieldFilters.equal.id)
      .set('startValue', resourceId.toString())
      .set('position', query.fields.length)
      .set('query', query.resource_uri);
    return replaceKey(query, 'fields', [
      ...query.fields,
      serializeResource(newField),
    ]);
  }, [rawQuery, model, resourceId, clearQueryFilters]);

  return (
    <RunReport
      query={query}
      recordSetId={undefined}
      definition={definition}
      parameters={parameters}
      onClose={handleClose}
    />
  );
}

function RecordSets({
  query,
  appResource,
  definition,
  parameters,
  onClose: handleClose,
}: {
  readonly query: SerializedResource<SpQuery>;
  readonly appResource: SerializedResource<SpAppResource>;
  readonly definition: Document;
  readonly parameters: IR<string>;
  readonly onClose: () => void;
}): JSX.Element {
  const tableId = React.useMemo(
    () =>
      query.contextTableId ??
      f.parseInt(parseSpecifyProperties(appResource.metaData ?? '').tableid),
    [query, appResource]
  );
  React.useEffect(
    () =>
      typeof query !== 'undefined' &&
      (typeof tableId === 'undefined' || tableId < 0)
        ? error("Couldn't determine table id for report")
        : undefined,
    [tableId, query]
  );
  const recordSetsPromise = React.useMemo(
    async () =>
      fetchCollection('RecordSet', {
        specifyUser: userInformation.id,
        type: 0,
        domainFilter: true,
        dbTableId: tableId,
        limit: 200,
      }),
    [tableId]
  );
  React.useEffect(
    () =>
      void recordSetsPromise
        .then(({ totalCount }) =>
          totalCount === 0 ? setState({ type: 'Raw' }) : undefined
        )
        .catch(console.error),
    [recordSetsPromise]
  );
  const [state, setState] = React.useState<
    | State<'Main'>
    | State<
        'RecordSet',
        {
          readonly recordSet: SerializedResource<RecordSet>;
          readonly autoRun: boolean;
        }
      >
    | State<'Raw'>
  >({ type: 'Main' });
  return state.type === 'Main' ? (
    <RecordSetsDialog
      recordSetsPromise={recordSetsPromise}
      onClose={handleClose}
      isReadOnly
      onConfigure={(recordSet): void =>
        setState({
          type: 'RecordSet',
          recordSet,
          autoRun: false,
        })
      }
      onSelect={(recordSet): void =>
        setState({
          type: 'RecordSet',
          recordSet,
          autoRun: true,
        })
      }
    >
      {({ children, dialog }): JSX.Element =>
        dialog(
          children,
          <Button.Blue onClick={(): void => setState({ type: 'Raw' })}>
            {commonText('query')}
          </Button.Blue>
        )
      }
    </RecordSetsDialog>
  ) : (
    <QueryParametersDialog
      query={query}
      autoRun={state.type === 'RecordSet' && state.autoRun}
      recordSetId={state.type === 'RecordSet' ? state.recordSet.id : undefined}
      definition={definition}
      parameters={parameters}
      onClose={handleClose}
    />
  );
}

function QueryParametersDialog({
  query,
  recordSetId,
  definition,
  parameters,
  autoRun,
  onClose: handleClose,
}: {
  readonly query: SerializedResource<SpQuery>;
  readonly recordSetId: number | undefined;
  readonly definition: Document;
  readonly parameters: IR<string>;
  readonly autoRun: boolean;
  readonly onClose: () => void;
}): JSX.Element {
  const model = getModelById(query.contextTableId);

  const [fields, setFields] = useLiveState<RA<QueryField>>(
    React.useCallback(() => parseQueryFields(query.fields), [query])
  );
  const id = useId('report-query');
  const [state, setState] = useLiveState<
    | State<'Main'>
    | State<
        'Running',
        {
          /*
           * This query here may be different from the one passed as a prop
           * since user can modify filters
           */
          query: SerializedResource<SpQuery>;
        }
      >
  >(
    React.useCallback(
      () =>
        autoRun
          ? {
              type: 'Running',
              query,
            }
          : { type: 'Main' },
      [autoRun, query]
    )
  );

  return state.type === 'Running' ? (
    <RunReport
      query={state.query}
      recordSetId={recordSetId}
      definition={definition}
      parameters={parameters}
      onClose={(): void => setState({ type: 'Main' })}
    />
  ) : (
    <Dialog
      icon={<span className="text-blue-500">{icons.documentReport}</span>}
      header={query.name ?? commonText('reports')}
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{formsText('runReport')}</Submit.Blue>
        </>
      }
    >
      <Form
        id={id('form')}
        onSubmit={(): void =>
          setState({
            type: 'Running',
            query: replaceKey(
              query,
              'fields',
              unParseQueryFields(model.name, fields, query.fields)
            ),
          })
        }
      >
        <QueryFields
          baseTableName={model.name}
          fields={fields}
          enforceLengthLimit={false}
          onChangeField={(line, field): void =>
            setFields(replaceItem(fields, line, field))
          }
          onMappingChange={undefined}
          onRemoveField={undefined}
          onOpen={undefined}
          onClose={undefined}
          onLineFocus={undefined}
          onLineMove={undefined}
          openedElement={undefined}
          showHiddenFields={false}
          getMappedFields={() => []}
        />
      </Form>
    </Dialog>
  );
}

function RunReport({
  query,
  recordSetId,
  definition,
  parameters,
  onClose: handleClose,
}: {
  readonly query: SerializedResource<SpQuery>;
  readonly recordSetId: number | undefined;
  readonly definition: Document;
  readonly parameters: IR<string>;
  readonly onClose: () => void;
}): JSX.Element {
  const reportWindowContext = useId('report-window')('');
  React.useEffect(
    () => void window.open('', reportWindowContext),
    [reportWindowContext, handleClose]
  );
  const [form, setForm] = React.useState<HTMLFormElement | null>(null);
  React.useEffect(() => {
    if (form === null) return;
    const container = document.createElement('div');
    container.classList.add('hidden');
    document.body.append(container);
    container.innerHTML = form.outerHTML;
    const newForm = container.children[0] as HTMLFormElement;
    newForm.submit();
    setTimeout(() => {
      container.remove();
      handleClose();
    }, 0);
  }, [form, handleClose]);
  return (
    <form
      action="/report_runner/run/"
      method="post"
      target={reportWindowContext}
      ref={setForm}
      className="hidden"
    >
      <input
        type="hidden"
        name="csrfmiddlewaretoken"
        defaultValue={csrfToken}
      />
      <input
        type="hidden"
        name="report"
        defaultValue={new XMLSerializer().serializeToString(
          definition.documentElement
        )}
      />
      <input
        type="hidden"
        name="query"
        defaultValue={JSON.stringify(
          keysToLowerCase({
            ...query,
            limit: 0,
            recordSetId,
          })
        )}
      />
      <input
        type="hidden"
        name="parameters"
        defaultValue={JSON.stringify(parameters)}
        readOnly
      />
      <input type="submit" />
    </form>
  );
}
