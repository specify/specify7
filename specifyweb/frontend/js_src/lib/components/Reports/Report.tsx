import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { useId } from '../../hooks/useId';
import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { reportsText } from '../../localization/report';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined, filterArray, localized } from '../../utils/types';
import { group, replaceKey } from '../../utils/utils';
import { parseXml } from '../AppResources/parseXml';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Submit } from '../Atoms/Submit';
import {
  attachmentsAvailable,
  formatAttachmentUrl,
} from '../Attachments/attachments';
import { UploadAttachment } from '../Attachments/Plugin';
import { LoadingContext } from '../Core/Contexts';
import { fetchCollection } from '../DataModel/collection';
import { backendFilter } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { SpAppResource, SpQuery } from '../DataModel/types';
import { error } from '../Errors/assert';
import { unknownIcon } from '../InitialContext/icons';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { ReportForRecord } from './ForRecord';
import type { ReportEntry } from './index';
import { ReportRecordSets } from './RecordSets';

export function Report({
  onClose: handleClose,
  resource,
  ...rest
}: {
  readonly resource: ReportEntry;
  readonly resourceId: number | undefined;
  readonly table: SpecifyTable | undefined;
  readonly onClose: () => void;
}): JSX.Element {
  return resource.query === undefined ? (
    <Dialog
      buttons={commonText.close()}
      header={reportsText.missingReportQuery()}
      icon={icons.documentReport}
      onClose={handleClose}
    >
      {reportsText.missingReportQueryDescription()}
    </Dialog>
  ) : resource.report === undefined ? (
    <Dialog
      buttons={commonText.close()}
      header={reportsText.missingReport()}
      icon={icons.documentReport}
      onClose={handleClose}
    >
      {reportsText.missingReportDescription()}
    </Dialog>
  ) : (
    <ReportDialog resource={resource} onClose={handleClose} {...rest} />
  );
}

function ReportDialog({
  resource: { appResource, report, query },
  resourceId,
  table,
  onClose: handleClose,
}: {
  readonly resource: ReportEntry;
  readonly resourceId: number | undefined;
  readonly table: SpecifyTable | undefined;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [definition] = useAsyncState(
    React.useCallback(
      async () =>
        fetchCollection('SpAppResourceData', {
          limit: 1,
          spAppResource: appResource.id,
          domainFilter: false,
        })
          .then(({ records }) =>
            parseXml(
              defined(
                records[0].data ?? undefined,
                'Trying to create a report from an invalid AppResource. ' +
                  'App Resource must have valid XML content'
              )
            )
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

  const [runCount, setRunCount] = React.useState(0);
  const [missingAttachments, setMissingAttachments] = useAsyncState(
    React.useCallback(
      async () => f.maybe(definition, fixupImages),
      [definition, runCount]
    ),
    true
  );
  return Array.isArray(missingAttachments) && typeof definition === 'object' ? (
    missingAttachments.length === 0 ? (
      <ParametersDialog
        appResource={appResource}
        definition={definition}
        query={query}
        resourceId={resourceId}
        table={table}
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

const reImage = /\$P\{\s*RPT_IMAGE_DIR\s*\}\s*\+\s*"\/"\s*\+\s*"(.*?)"/u;

async function fixupImages(definition: Element): Promise<RA<LocalizedString>> {
  const fileNames = Object.fromEntries(
    group(
      filterArray(
        Array.from(definition.querySelectorAll('imageExpression'), (image) => {
          const match = image.classList.contains('java.net.URL')
            ? undefined
            : image.textContent?.match(reImage)?.slice(1)?.[0] ?? undefined;
          return typeof match === 'string' ? [match, image] : undefined;
        })
      )
    )
  );
  const attachments = await fetchCollection(
    'Attachment',
    {
      limit: 0,
      domainFilter: false,
    },
    backendFilter('title').isIn(Object.keys(fileNames))
  ).then(({ records }) => records);
  const indexedAttachments = Object.fromEntries(
    attachments.map((record) => [record.title ?? '', record])
  );

  const badImageUrl = `"${globalThis.location.origin}${unknownIcon}"`;
  return filterArray(
    Object.entries(fileNames).map(([fileName, imageExpressions]) => {
      const attachment = indexedAttachments[fileName];
      const imageUrl =
        typeof attachment === 'object' && attachmentsAvailable()
          ? `"${formatAttachmentUrl(attachment, undefined)!}"`
          : badImageUrl;
      imageExpressions.forEach((image) => {
        image.textContent = imageUrl;
      });
      return attachment === undefined ? localized(fileName) : undefined;
    })
  );
}

function FixImagesDialog({
  missingAttachments,
  onIgnore: handleIgnore,
  onRefresh: handleRefresh,
  onClose: handleClose,
}: {
  readonly missingAttachments: RA<LocalizedString>;
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
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Button.Warning onClick={handleIgnore}>
            {commonText.ignore()}
          </Button.Warning>
        </>
      }
      header={reportsText.reportProblems()}
      icon={icons.documentReport}
      onClose={handleClose}
    >
      {reportsText.reportProblemsDescription()}
      <H3>{reportsText.missingAttachments()}</H3>
      <Ul>
        {missingAttachments.map((fileName, index) => (
          <Button.LikeLink
            aria-label={reportsText.fix()}
            key={fileName}
            title={reportsText.fix()}
            onClick={(): void => setIndex(index)}
          >
            {fileName}
          </Button.LikeLink>
        ))}
      </Ul>
    </Dialog>
  ) : (
    <Dialog
      buttons={commonText.cancel()}
      header={reportsText.chooseFile()}
      icon={icons.documentReport}
      onClose={(): void => setIndex(undefined)}
    >
      <UploadAttachment
        onUploaded={(attachment): void =>
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
  table,
  onClose: handleClose,
}: {
  readonly definition: Element;
  readonly query: SerializedResource<SpQuery> | false | undefined;
  readonly appResource: SerializedResource<SpAppResource>;
  readonly resourceId: number | undefined;
  readonly table: SpecifyTable | undefined;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [parameters, setParameters] = useLiveState(
    React.useCallback(
      () =>
        Object.fromEntries(
          filterArray(
            Array.from(
              definition.querySelectorAll('parameter[isForPrompting="true"]'),
              (parameter) => parameter.getAttribute('name')
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
      typeof resourceId === 'number' && typeof table === 'object' ? (
        <ReportForRecord
          definition={definition}
          parameters={parameters}
          query={query}
          resourceId={resourceId}
          table={table}
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
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Submit.Save form={id('form')}>{commonText.save()}</Submit.Save>
        </>
      }
      header={reportsText.reportParameters()}
      icon={icons.documentReport}
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
