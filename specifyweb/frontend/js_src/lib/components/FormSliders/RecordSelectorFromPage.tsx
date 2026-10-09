import React from 'react';
import { RA } from '../../utils/types';
import { ResourceView } from '../Forms/ResourceView';
import { SpecifyTable } from '../DataModel/specifyTable';
import { useLiveState } from '../../hooks/useLiveState';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { AnySchema } from '../DataModel/helperTypes';
import { LocalizedString } from 'typesafe-i18n';
import { hasTablePermission } from '../Permissions/helpers';
import { BasicSlider } from './BasicSlider';
import { DataEntry } from '../Atoms/DataEntry';
import { commonText } from '../../localization/common';
import { clamp } from '../../utils/utils';
import { SetUnloadProtectsContext } from '../Router/UnloadProtect';
import { Dialog } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { unsetUnloadProtect } from '../../hooks/navigation';
import { saveFormUnloadProtect } from '../Forms/Save';
import { formsText } from '../../localization/forms';
import { useTriggerState } from '../../hooks/useTriggerState';

type Page = {
  readonly ids: RA<number>;
  readonly complete: boolean;
};

export type PageMetaData = 'single' | 'first' | 'last' | undefined;

function usePagedRecordSelector<SCHEMA extends AnySchema>({
  pageMetaData,
  index,
  records,
  onSlide: handleSlide,
  onDelete: handleDelete,
}: {
  readonly pageMetaData: PageMetaData;
  readonly index: number;
  readonly records: RA<SpecifyResource<SCHEMA>> | undefined;
  readonly onSlide: (direction: 'next' | 'previous' | 'first' | 'last') => void;
  readonly onDelete?: (index: number) => void;
}) {
  const disableNextButtons =
    records !== undefined &&
    index === records.length - 1 &&
    (pageMetaData === 'last' || pageMetaData === 'single');

  const disablePreviousButtons =
    (pageMetaData === 'single' || pageMetaData === 'first') && index === 0;

  return {
    slider: (
      <BasicSlider
        onChange={handleSlide}
        buttonsDisabled={{
          first: disablePreviousButtons,
          next: disableNextButtons,
          previous: disablePreviousButtons,
          last: disableNextButtons,
        }}
      />
    ),
    isLoading: records == undefined || records[index] === undefined,
    resource: records?.[index],
    onRemove: () => {
      handleDelete?.(index);
      handleSlide('previous');
    },
  };
}

export function RecordSelectorFromPage<
  SCHEMA extends AnySchema,
  PAGE_TYPE extends Page,
>({
  page: initialPage,
  pageMetaData,
  pageSize,
  pageKey,
  dialog,
  headerButtons,
  isDependent = false,
  isLoading: isExternalLoading = false,
  table,
  title,
  viewName,
  onNextPageFetch: handleNextPageFetch,
  onClose: handleClose,
  onDelete: handleDelete,
  onSaved: handleSaved,
}: {
  readonly page: PAGE_TYPE | undefined;
  readonly pageKey: string | undefined;
  readonly pageSize: number;
  readonly pageMetaData: PageMetaData;
  readonly dialog: false | 'modal' | 'nonModal';
  readonly headerButtons?: JSX.Element;
  readonly isLoading?: boolean;
  readonly isDependent?: boolean;
  readonly table: SpecifyTable<SCHEMA>;
  readonly title: LocalizedString | undefined;
  readonly viewName?: string;
  readonly onNextPageFetch: (
    previousPage: PAGE_TYPE,
    direction: 'next' | 'previous' | 'first' | 'last'
  ) => void;
  readonly onClose: () => void;
  readonly onDelete: (page: PAGE_TYPE, index: number) => void;
  readonly onSaved: (resource: SpecifyResource<SCHEMA>) => void;
}): JSX.Element | null {
  const [page] = useTriggerState(initialPage);

  const [records] = useLiveState<RA<SpecifyResource<SCHEMA>> | undefined>(
    React.useCallback(
      () => page?.ids.map((id) => new table.Resource({ id })),
      [page]
    )
  );
  const [indexInPage, setIndexInPage] = React.useState(0);

  React.useEffect(() => {
    setIndexInPage(0);
  }, [table, pageKey]);

  const currentResource = records?.[indexInPage];

  // Show a warning dialog if navigating away before saving the record
  const [unloadProtect, setUnloadProtect] = React.useState<
    (() => void) | undefined
  >(undefined);
  const setUnloadProtects = React.useContext(SetUnloadProtectsContext)!;

  function handleSlide(direction: 'next' | 'previous' | 'first' | 'last') {
    if (page === undefined || records === undefined) {
      return;
    }
    if (
      direction === 'first' &&
      (pageMetaData === 'single' || pageMetaData === 'first')
    ) {
      setIndexInPage(0);
      return;
    }
    if (
      direction === 'last' &&
      (pageMetaData === 'single' || pageMetaData === 'last')
    ) {
      setIndexInPage(records.length - 1);
      return;
    }
    if (direction === 'first') {
      setIndexInPage(0);
      return handleNextPageFetch(page, 'first');
    }
    if (direction === 'last') {
      setIndexInPage(pageSize - 1);
      return handleNextPageFetch(page, 'last');
    }
    if (indexInPage === 0 && direction === 'previous') {
      setIndexInPage(pageSize - 1);
      return handleNextPageFetch(page, 'previous');
    }

    if (indexInPage === records.length - 1 && direction === 'next') {
      setIndexInPage(0);
      return handleNextPageFetch(page, 'next');
    }
    setIndexInPage((oldIndex) =>
      clamp(0, direction === 'next' ? oldIndex + 1 : oldIndex - 1, pageSize - 1)
    );
    return;
  }

  const {
    resource,
    slider,
    isLoading,
    onRemove: handleRemove,
  } = usePagedRecordSelector({
    index: indexInPage,
    pageMetaData,
    records,
    onDelete:
      page === undefined ? undefined : (index) => handleDelete(page, index),
    onSlide: (direction) => {
      const doSlide = () => handleSlide(direction);

      if (currentResource?.needsSaved === true) {
        setUnloadProtect(() => doSlide);
      } else doSlide();
    },
  });

  return (
    <>
      <ResourceView
        dialog={dialog}
        headerButtons={(specifyNetworkBadge): JSX.Element => (
          <div className="flex flex-col items-center gap-2 md:contents md:flex-row md:gap-8">
            <div className="flex items-center gap-2 md:contents">
              {headerButtons}
              <DataEntry.Visit resource={resource} />
              <span
                className={`flex-1 ${dialog === false ? '-ml-2' : '-ml-4'}`}
              />
              {specifyNetworkBadge}
            </div>
            {slider}
          </div>
        )}
        isDependent={isDependent}
        isLoading={isLoading || isExternalLoading}
        isSubForm={false}
        resource={resource}
        title={title}
        viewName={viewName}
        onClose={handleClose}
        onDeleted={
          hasTablePermission(table.name, 'delete') ? handleRemove : undefined
        }
        onSaved={() => handleSaved(currentResource!)}
        onAdd={undefined}
      />
      {typeof unloadProtect === 'function' && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Warning
                onClick={(): void => {
                  unsetUnloadProtect(setUnloadProtects, saveFormUnloadProtect);
                  setUnloadProtects([]);
                  unloadProtect();
                  setUnloadProtect(undefined);
                }}
              >
                {commonText.proceed()}
              </Button.Warning>
            </>
          }
          header={formsText.recordSelectorUnloadProtect()}
          onClose={(): void => setUnloadProtect(undefined)}
        >
          {formsText.recordSelectorUnloadProtectDescription()}
        </Dialog>
      )}
    </>
  );
}
