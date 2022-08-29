import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { useId } from '../../hooks/useId';
import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { getAttribute, group, replaceKey } from '../../utils/utils';
import { parseXml } from '../AppResources/codeMirrorLinters';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Submit } from '../Atoms/Submit';
import {
  attachmentsAvailable,
  formatAttachmentUrl,
} from '../Attachments/attachments';
import { AttachmentsPlugin } from '../Attachments/Plugin';
import { LoadingContext } from '../Core/Contexts';
import { fetchCollection } from '../DataModel/collection';
import type { SerializedResource } from '../DataModel/helperTypes';
import { fetchResource, idFromUrl } from '../DataModel/resource';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { SpAppResource, SpQuery, SpReport } from '../DataModel/types';
import { error } from '../Errors/assert';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { ReportForRecord } from './ForRecord';
import { ReportRecordSets } from './RecordSets';

export function Report({
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
        })
          .then(({ records }) =>
            parseXml(defined(records[0].data ?? undefined))
          )
          .then((parsed) =>
            typeof parsed === 'object'
              ? parsed
              : error(`Failed parsing XML report definition`, { report })
          ),
      [appResource]
    ),
    true
  );

  const [report] = useAsyncState<
    SerializedResource<SpReport> | false | undefined
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
  const [query] = useAsyncState<SerializedResource<SpQuery> | false>(
    React.useCallback(
      () =>
        typeof report === 'object'
          ? f.maybe(idFromUrl(report.query), async (id) =>
              fetchResource('SpQuery', id, false).then(
                (resource) => resource ?? false
              )
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
      buttons={commonText('close')}
      header={formsText('missingReportQueryDialogHeader')}
      icon={<span className="text-blue-500">{icons.documentReport}</span>}
      onClose={handleClose}
    >
      {formsText('missingReportQueryDialogText')}
    </Dialog>
  ) : report === false ? (
    <Dialog
      buttons={commonText('close')}
      header={formsText('missingReportDialogHeader')}
      icon={<span className="text-blue-500">{icons.documentReport}</span>}
      onClose={handleClose}
    >
      {formsText('missingReportDialogText')}
    </Dialog>
  ) : Array.isArray(missingAttachments) && typeof definition === 'object' ? (
    missingAttachments.length === 0 ? (
      <ParametersDialog
        appResource={appResource}
        definition={definition}
        model={model}
        query={typeof query === 'object' ? query : undefined}
        resourceId={resourceId}
        onClose={handleClose}
      />
    ) : (
      <FixImagesDialog
        missingAttachments={missingAttachments}
        onClose={handleClose}
        onIgnore={(): void => setMissingAttachments([])}
        onRefresh={(): void => setRunCount(runCount + 1)}
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

  const badImageUrl = `"${globalThis.location.origin}/images/unknown.png"`;
  return filterArray(
    Object.entries(fileNames).map(([fileName, imageExpressions]) => {
      const attachment = indexedAttachments[fileName];
      const imageUrl =
        typeof attachment === 'object' && attachmentsAvailable()
          ? `"${defined(formatAttachmentUrl(attachment, undefined))}"`
          : badImageUrl;
      imageExpressions.forEach((image) => {
        image.textContent = imageUrl;
      });
      return attachment === undefined ? fileName : undefined;
    })
  );
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
  return index === undefined ? (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Button.Orange onClick={handleIgnore}>
            {commonText('ignore')}
          </Button.Orange>
        </>
      }
      header={formsText('reportProblemsDialogTitle')}
      icon={<span className="text-blue-500">{icons.documentReport}</span>}
      onClose={handleClose}
    >
      {formsText('reportsProblemsDialogText')}
      <H3>{formsText('missingAttachments')}</H3>
      <Ul>
        {missingAttachments.map((fileName, index) => (
          <Button.LikeLink
            aria-label={formsText('fix')}
            key={fileName}
            title={formsText('fix')}
            onClick={(): void => setIndex(index)}
          >
            {fileName}
          </Button.LikeLink>
        ))}
      </Ul>
    </Dialog>
  ) : (
    <Dialog
      buttons={commonText('cancel')}
      header={formsText('missingAttachmentsFixDialogTitle')}
      icon={<span className="text-blue-500">{icons.documentReport}</span>}
      onClose={(): void => setIndex(undefined)}
    >
      <AttachmentsPlugin
        mode="edit"
        resource={undefined}
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
  useErrorContext('definition', definition);
  useErrorContext('parameters', parameters);
  useErrorContext('query', query);
  useErrorContext('appResource', appResource);

  const [isSubmitted, handleSubmitted] = useBooleanState(
    Object.values(parameters).length === 0
  );

  const id = useId('report-parameters');
  return isSubmitted ? (
    typeof query === 'object' ? (
      typeof resourceId === 'number' && typeof model === 'object' ? (
        <ReportForRecord
          definition={definition}
          model={model}
          parameters={parameters}
          query={query}
          resourceId={resourceId}
          onClose={handleClose}
        />
      ) : (
        <ReportRecordSets
          appResource={appResource}
          definition={definition}
          parameters={parameters}
          query={query}
          onClose={handleClose}
        />
      )
    ) : (
      <LoadingScreen />
    )
  ) : (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Submit.Green form={id('form')}>{commonText('save')}</Submit.Green>
        </>
      }
      header={formsText('reportParameters')}
      icon={<span className="text-blue-500">{icons.documentReport}</span>}
      onClose={handleClose}
    >
      <Form id={id('form')} onSubmit={handleSubmitted}>
        {Object.entries(parameters).map(([name, value]) => (
          <Label.Block key={name}>
            {name}
            <Input.Text
              autoComplete="on"
              spellCheck
              value={value}
              onValueChange={(value): void =>
                setParameters(replaceKey(parameters, name, value))
              }
            />
          </Label.Block>
        ))}
      </Form>
    </Dialog>
  );
}
