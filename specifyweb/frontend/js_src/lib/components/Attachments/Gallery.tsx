import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import type { RA } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import { Container } from '../Atoms';
import { LoadingContext } from '../Core/Contexts';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Attachment } from '../DataModel/types';
import { raise } from '../Errors/Crash';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { ResourceView } from '../Forms/ResourceView';
import { loadingGif } from '../Molecules';
import { AttachmentCell } from './Cell';
import { AttachmentDialog } from './Dialog';

const preFetchDistance = 200;

export function AttachmentGallery({
  attachments,
  onFetchMore: handleFetchMore,
  scale,
  isComplete,
  onChange: handleChange,
}: {
  readonly attachments: RA<SerializedResource<Attachment>>;
  readonly onFetchMore: (() => Promise<void>) | undefined;
  readonly scale: number;
  readonly isComplete: boolean;
  readonly onChange: (attachments: RA<SerializedResource<Attachment>>) => void;
}): JSX.Element {
  const containerRef = React.useRef<HTMLElement | null>(null);

  const rawFillPage = React.useCallback(
    async () =>
      // Fetch more attachments when within 200px of the bottom
      containerRef.current !== null &&
      containerRef.current.scrollTop + preFetchDistance >
        containerRef.current.scrollHeight - containerRef.current.clientHeight
        ? handleFetchMore?.().catch(raise)
        : undefined,
    [handleFetchMore]
  );

  const fillPage = handleFetchMore === undefined ? undefined : rawFillPage;

  React.useEffect(
    () =>
      // Fetch attachments while scroll bar is not visible
      void (containerRef.current?.scrollHeight ===
      containerRef.current?.clientHeight
        ? fillPage?.().catch(raise)
        : undefined),
    [fillPage, attachments]
  );

  const [viewRecord, setViewRecord] = React.useState<
    SpecifyResource<AnySchema> | undefined
  >(undefined);
  const [openIndex, setOpenIndex] = React.useState<number | undefined>(
    undefined
  );
  const [related, setRelated] = React.useState<
    RA<SpecifyResource<AnySchema> | undefined>
  >([]);

  const loading = React.useContext(LoadingContext);
  return (
    <>
      <Container.Base
        className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(var(--scale),1fr))]
          items-center gap-4"
        forwardRef={containerRef}
        style={
          {
            '--scale': `${scale}rem`,
          } as React.CSSProperties
        }
        onScroll={isComplete ? undefined : fillPage}
      >
        {attachments.map((attachment, index) => (
          <AttachmentCell
            attachment={attachment}
            key={index}
            related={[
              related[index],
              (item): void => setRelated(replaceItem(related, index, item)),
            ]}
            onOpen={(): void => setOpenIndex(index)}
            onViewRecord={(model, id): void =>
              setViewRecord(new model.Resource({ id }))
            }
          />
        ))}
        {isComplete
          ? attachments.length === 0 && <p>{attachmentsText.noAttachments()}</p>
          : loadingGif}
      </Container.Base>
      {typeof viewRecord === 'object' && (
        <ErrorBoundary dismissible>
          <ResourceView
            dialog="modal"
            isDependent={false}
            isSubForm={false}
            mode="edit"
            resource={viewRecord}
            onAdd={undefined}
            onClose={(): void => setViewRecord(undefined)}
            onDeleted={undefined}
            onSaved={undefined}
          />
        </ErrorBoundary>
      )}
      {typeof openIndex === 'number' &&
      typeof attachments[openIndex] === 'object' ? (
        <AttachmentDialog
          attachment={attachments[openIndex]}
          related={[
            related[openIndex],
            (item): void => setRelated(replaceItem(related, openIndex, item)),
          ]}
          onChange={(newAttachment): void =>
            handleChange(replaceItem(attachments, openIndex, newAttachment))
          }
          onClose={(): void => setOpenIndex(undefined)}
          onNext={
            handleFetchMore !== undefined &&
            isComplete &&
            openIndex === attachments.length
              ? undefined
              : (): void => {
                  setOpenIndex(openIndex + 1);
                  if (attachments[openIndex + 1] === undefined)
                    loading(handleFetchMore!());
                }
          }
          onPrevious={
            openIndex === 0
              ? undefined
              : (): void => setOpenIndex(openIndex - 1)
          }
          onViewRecord={(model, id): void =>
            setViewRecord(new model.Resource({ id }))
          }
        />
      ) : null}
    </>
  );
}
