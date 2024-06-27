import React from 'react';

import { FormCell } from '.';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { icons } from '../Atoms/Icons';
import { useAttachment } from '../Attachments/Plugin';
import { AttachmentViewer } from '../Attachments/Viewer';
import { ReadOnlyContext, SearchDialogContext } from '../Core/Contexts';
import { AnySchema } from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { ViewDescription } from '../FormParse';
import { attachmentView } from '../FormParse/webOnlyViews';
import { AttachmentPluginSkeleton } from '../SkeletonLoaders/AttachmentPlugin';

export function CollapsedForm({
  resource,
  collapsedViewDefinition,
  isReadOnly,
  isInSearchDialog,
  onExpand: handleExpand,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly collapsedViewDefinition: ViewDescription;
  readonly isReadOnly: boolean;
  readonly isInSearchDialog: boolean;
  readonly onExpand: () => void;
}): JSX.Element {
  const id = useId('form-table');

  return (
    <>
      <div className="h-full" role="cell">
        <Button.Small
          aria-label={commonText.expand()}
          className="h-full"
          title={commonText.expand()}
          onClick={handleExpand}
        >
          {icons.chevronRight}
        </Button.Small>
      </div>
      <ReadOnlyContext.Provider value={isReadOnly}>
        <SearchDialogContext.Provider value={isInSearchDialog}>
          {collapsedViewDefinition.name === attachmentView ? (
            <div className="flex gap-8" role="cell">
              <Attachment resource={resource} />
            </div>
          ) : (
            collapsedViewDefinition.rows[0].map(
              (
                {
                  colSpan,
                  align,
                  verticalAlign,
                  visible,
                  id: cellId,
                  ...cellData
                },
                index
              ) => (
                <DataEntry.Cell
                  align={align}
                  colSpan={colSpan}
                  key={index}
                  role="cell"
                  verticalAlign={verticalAlign}
                  visible={visible}
                >
                  <FormCell
                    align={align}
                    cellData={cellData}
                    formatId={(suffix: string): string =>
                      id(`${index}-${suffix}`)
                    }
                    formType="formTable"
                    id={cellId}
                    resource={resource}
                    verticalAlign={verticalAlign}
                  />
                </DataEntry.Cell>
              )
            )
          )}
        </SearchDialogContext.Provider>
      </ReadOnlyContext.Provider>
    </>
  );
}

function Attachment({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
}): JSX.Element | null {
  const related = React.useState<SpecifyResource<AnySchema> | undefined>(
    undefined
  );
  const [attachment] = useAttachment(resource);
  return typeof attachment === 'object' ? (
    <AttachmentViewer
      attachment={attachment}
      related={related}
      showMeta={false}
      onViewRecord={undefined}
    />
  ) : attachment === false ? (
    <p>{formsText.noData()}</p>
  ) : (
    <AttachmentPluginSkeleton />
  );
}
