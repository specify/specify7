import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import type { RA } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import { Container } from '../Atoms';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Attachment } from '../DataModel/types';
import { raise } from '../Errors/Crash';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { ResourceView } from '../Forms/ResourceView';
import { loadingGif } from '../Molecules';
import { AttachmentCell } from './Cell';

const preFetchDistance = 200;

export function AttachmentGallery({
  attachments,
  onFetchMore: handleFetchMore,
  scale,
  isComplete,
  onChange: handleChange,
}: {
  readonly attachments: RA<SerializedResource<Attachment>>;
  readonly onFetchMore: () => Promise<void>;
  readonly scale: number;
  readonly isComplete: boolean;
  readonly onChange: (attachments: RA<SerializedResource<Attachment>>) => void;
}): JSX.Element {
  const containerRef = React.useRef<HTMLElement | null>(null);

  const fillPage = React.useCallback(
    async () =>
      // Fetch more attachments when within 200px of the bottom
      containerRef.current !== null &&
      containerRef.current.scrollTop + preFetchDistance >
        containerRef.current.scrollHeight - containerRef.current.clientHeight
        ? handleFetchMore().catch(raise)
        : undefined,
    [handleFetchMore]
  );

  React.useEffect(
    () =>
      // Fetch attachments while scroll bar is not visible
      void (containerRef.current?.scrollHeight ===
      containerRef.current?.clientHeight
        ? fillPage().catch(raise)
        : undefined),
    [fillPage, attachments]
  );

  const [viewRecord, setViewRecord] = React.useState<
    SpecifyResource<AnySchema> | undefined
  >(undefined);
  return (
    <>
      <Container.Base
        className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(var(--scale),1fr))] items-center
          gap-4"
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
            onChange={(newAttachment): void =>
              handleChange(replaceItem(attachments, index, newAttachment))
            }
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
    </>
  );
}
