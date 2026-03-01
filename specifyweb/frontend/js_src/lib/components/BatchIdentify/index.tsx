import React from 'react';

import { useValidation } from '../../hooks/useValidation';
import { batchIdentifyText } from '../../localization/batchIdentify';
import { commonText } from '../../localization/common';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { fetchCollection } from '../DataModel/collection';
import { getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import { createResource } from '../DataModel/resource';
import { serializeResource } from '../DataModel/serializers';
import { tables } from '../DataModel/tables';
import type { RecordSet } from '../DataModel/types';
import { ResourceView } from '../Forms/ResourceView';
import { RecordSelectorFromIds } from '../FormSliders/RecordSelectorFromIds';
import { userInformation } from '../InitialContext/userInformation';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { hasToolPermission } from '../Permissions/helpers';
import { ProtectedTable } from '../Permissions/PermissionDenied';
import type { QueryField } from '../QueryBuilder/helpers';
import { QueryResultsWrapper } from '../QueryBuilder/ResultsWrapper';
import { OverlayContext } from '../Router/Router';
import { useSearchDialog } from '../SearchDialog';
import { RecordSetsDialog } from '../Toolbar/RecordSets';

type BatchIdentifyResolveResponse = {
  readonly collectionObjectIds: RA<number>;
  readonly currentDeterminationIds: RA<number>;
  readonly unmatchedCatalogNumbers: RA<string>;
};

type BatchIdentifySaveResponse = {
  readonly createdCount: number;
  readonly collectionObjectIds: RA<number>;
  readonly determinationIds: RA<number>;
};

type Step = 'catalogNumbers' | 'determination';

type CatalogToken = number | '-';

const liveValidationDebounceMs = 1000;
const collectionObjectViewPathRe = /\/specify\/view\/collectionobject\/(\d+)\/?$/i;

const parseCatalogNumberEntries = (rawEntries: string): RA<string> =>
  rawEntries
    .split('\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const tokenizeCatalogEntry = (entry: string): RA<CatalogToken> => {
  const tokens: readonly CatalogToken[] = [];
  let currentNumber = '';

  for (const character of entry) {
    if (character >= '0' && character <= '9') {
      currentNumber += character;
      continue;
    }

    if (currentNumber.length > 0) {
      tokens.push(Number(currentNumber));
      currentNumber = '';
    }

    if (character === '-') tokens.push('-');
  }

  if (currentNumber.length > 0) tokens.push(Number(currentNumber));
  return tokens;
};

const parseCatalogNumberRanges = (
  entries: RA<string>
): RA<readonly [number, number]> =>
  entries.flatMap((entry) => {
    const tokens = tokenizeCatalogEntry(entry);
    const ranges: readonly (readonly [number, number])[] = [];
    let index = 0;
    while (index < tokens.length) {
      const token = tokens[index];
      if (token === '-') {
        index += 1;
        continue;
      }

      let start = token;
      let end = start;
      const rangeEndToken = tokens[index + 2];
      if (
        tokens[index + 1] === '-' &&
        typeof rangeEndToken === 'number'
      ) {
        end = rangeEndToken;
        index += 3;
      } else index += 1;

      if (start > end) [start, end] = [end, start];
      ranges.push([start, end]);
    }
    return ranges;
  });

const queryFilterDefaults = {
  isNot: false,
  isStrict: false,
} as const;

const anyFilter = {
  ...queryFilterDefaults,
  type: 'any',
  startValue: '',
} as const;

const buildPreviewFields = (
  collectionObjectIds: RA<number>
): RA<QueryField> => [
  {
    id: 0,
    mappingPath: ['collectionObjectId'],
    sortType: undefined,
    isDisplay: false,
    filters: [
      {
        ...queryFilterDefaults,
        type: 'in',
        startValue: collectionObjectIds.join(', '),
      },
    ],
  },
  {
    id: 1,
    mappingPath: ['catalogNumber'],
    sortType: 'ascending',
    isDisplay: true,
    filters: [anyFilter],
  },
  {
    id: 2,
    mappingPath: ['determinations', '#1', 'determinedDate'],
    sortType: undefined,
    isDisplay: true,
    filters: [anyFilter],
  },
  {
    id: 3,
    mappingPath: ['determinations', '#1', 'typeStatusName'],
    sortType: undefined,
    isDisplay: true,
    filters: [anyFilter],
  },
  {
    id: 4,
    mappingPath: ['determinations', '#1', 'preferredTaxon', 'name'],
    sortType: undefined,
    isDisplay: true,
    filters: [anyFilter],
  },
  {
    id: 5,
    mappingPath: ['determinations', '#1', 'taxon', 'name'],
    sortType: undefined,
    isDisplay: true,
    filters: [anyFilter],
  },
  {
    id: 6,
    mappingPath: ['determinations', '#1', 'isCurrent'],
    sortType: undefined,
    isDisplay: false,
    filters: [
      {
        ...queryFilterDefaults,
        type: 'true',
        startValue: '',
      },
    ],
  },
];

const createBatchIdentifyPreviewQuery = () =>
  new tables.SpQuery.Resource()
    .set('name', batchIdentifyText.previewQueryName())
    .set('contextName', tables.CollectionObject.name)
    .set('contextTableId', tables.CollectionObject.tableId)
    .set('selectDistinct', false)
    .set('smushed', false)
    .set('countOnly', false)
    .set('formatAuditRecIds', false)
    .set('specifyUser', userInformation.resource_uri)
    .set('isFavorite', true)
    .set('ordinal', 32_767);

const fetchRecordSetCollectionObjectIds = async (
  recordSetId: number
): Promise<RA<number>> => {
  const limit = 2000;
  let offset = 0;
  let totalCount = 0;
  const collectionObjectIds: readonly number[] = [];

  do {
    const { records, totalCount: fetchedTotalCount } = await fetchCollection(
      'RecordSetItem',
      {
        recordSet: recordSetId,
        domainFilter: false,
        limit,
        offset,
        orderBy: 'id',
      }
    );
    totalCount = fetchedTotalCount;
    collectionObjectIds.push(...records.map(({ recordId }) => recordId));
    offset += records.length;
    if (records.length === 0) break;
  } while (offset < totalCount);

  return f.unique(collectionObjectIds);
};

const createBatchIdentifyRecordSet = async (
  collectionObjectIds: RA<number>
): Promise<SerializedResource<RecordSet> | undefined> => {
  if (
    collectionObjectIds.length === 0 ||
    !hasToolPermission('recordSets', 'create')
  )
    return undefined;

  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
  return createResource('RecordSet', {
    name: `${batchIdentifyText.updatedRecordSet()} ${timestamp}`,
    version: 1,
    type: 0,
    dbTableId: tables.CollectionObject.tableId,
    // @ts-expect-error Inline RecordSetItem creation is supported by the API
    recordSetItems: f.unique(collectionObjectIds).map((recordId) => ({
      recordId,
    })),
  });
};

export function BatchIdentifyOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  return (
    <ProtectedTable action="read" tableName="CollectionObject">
      <ProtectedTable action="create" tableName="Determination">
        <BatchIdentifyDialog onClose={handleClose} />
      </ProtectedTable>
    </ProtectedTable>
  );
}

function BatchIdentifyDialog({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const { validationRef, setValidation } = useValidation<HTMLTextAreaElement>();
  const catalogNumberLabel = getField(
    tables.CollectionObject,
    'catalogNumber'
  ).label;
  const collectionObjectLabel = tables.CollectionObject.label;
  const recordSetLabel = tables.RecordSet.label;

  const [step, setStep] = React.useState<Step>('catalogNumbers');
  const [catalogNumbers, setCatalogNumbers] = React.useState('');
  const [isIdentifying, setIsIdentifying] = React.useState(false);
  const [isResolving, setIsResolving] = React.useState(false);
  const [isLiveValidating, setIsLiveValidating] = React.useState(false);
  const [isRecordSetDialogOpen, setIsRecordSetDialogOpen] = React.useState(false);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] =
    React.useState<number>();
  const [collectionObjectIds, setCollectionObjectIds] = React.useState<RA<number>>(
    []
  );
  const [createdRecordSet, setCreatedRecordSet] = React.useState<
    SerializedResource<RecordSet> | undefined
  >(undefined);
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [resolvedCollectionObjectIds, setResolvedCollectionObjectIds] =
    React.useState<RA<number>>([]);
  const [validatedCatalogNumbersKey, setValidatedCatalogNumbersKey] =
    React.useState('');
  const [unmatchedCatalogNumbers, setUnmatchedCatalogNumbers] = React.useState<
    RA<string>
  >([]);
  const [previewRunCount, setPreviewRunCount] = React.useState(0);
  const [selectedPreviewRows, setSelectedPreviewRows] = React.useState<
    ReadonlySet<number>
  >(new Set());
  const [determination] = React.useState(
    () => new tables.Determination.Resource().set('isCurrent', true)
  );
  const [previewQuery] = React.useState(createBatchIdentifyPreviewQuery);
  const liveValidationRequestTokenRef = React.useRef(0);
  const liveValidationTimeoutRef = React.useRef<
    ReturnType<typeof globalThis.setTimeout> | undefined
  >(undefined);
  const stepRef = React.useRef<Step>(step);

  const catalogNumberEntries = React.useMemo(
    () => parseCatalogNumberEntries(catalogNumbers),
    [catalogNumbers]
  );
  const catalogNumberRanges = React.useMemo(
    () => parseCatalogNumberRanges(catalogNumberEntries),
    [catalogNumberEntries]
  );
  const previewFields = React.useMemo(
    () => buildPreviewFields(collectionObjectIds),
    [collectionObjectIds]
  );
  const selectedPreviewRowsCount = selectedPreviewRows.size;
  const catalogNumbersKey = React.useMemo(
    () => catalogNumberEntries.join('\n'),
    [catalogNumberEntries]
  );

  const handleAddCollectionObjects = React.useCallback(
    (resources: RA<{ readonly id: number }>): void => {
      const mergedCollectionObjectIds = f.unique([
        ...collectionObjectIds,
        ...resources.map(({ id }) => id),
      ]);
      if (mergedCollectionObjectIds.length === collectionObjectIds.length) return;
      setCollectionObjectIds(mergedCollectionObjectIds);
      setSelectedPreviewRows(new Set<number>());
      setPreviewRunCount((count) => count + 1);
    },
    [collectionObjectIds]
  );

  const { searchDialog, showSearchDialog } = useSearchDialog({
    extraFilters: undefined,
    forceCollection: undefined,
    multiple: true,
    table: tables.CollectionObject,
    onSelected: handleAddCollectionObjects,
  });

  const handleRemoveSelectedCollectionObjects = React.useCallback((): void => {
    if (selectedPreviewRowsCount === 0) return;
    setCollectionObjectIds(
      collectionObjectIds.filter((id) => !selectedPreviewRows.has(id))
    );
    setSelectedPreviewRows(new Set<number>());
    setPreviewRunCount((count) => count + 1);
  }, [collectionObjectIds, selectedPreviewRows, selectedPreviewRowsCount]);

  const handlePreviewPopOutClick = React.useCallback(
    (event: React.MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest(
        'a.print\\:hidden[target="_blank"]'
      ) ;
      if (link === null) return;
      const match = collectionObjectViewPathRe.exec(link.href);
      if (match === null) return;
      const recordId = Number(match[1]);
      if (!Number.isInteger(recordId) || recordId <= 0) return;
      event.preventDefault();
      setIsVerificationDialogOpen(recordId);
    },
    []
  );

  React.useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const resolveCatalogNumbers = React.useCallback(
    async (
      entries: RA<string>,
      options: {
        readonly validateOnly?: boolean;
        readonly errorMode?: 'dismissible' | 'silent';
      } = {}
    ): Promise<BatchIdentifyResolveResponse> =>
      ajax<BatchIdentifyResolveResponse>('/api/specify/batch_identify/resolve/', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: {
          catalogNumbers: entries,
          validateOnly: options.validateOnly === true,
        },
        errorMode: options.errorMode ?? 'dismissible',
      }).then(({ data }) => data),
    []
  );

  const proceedWithCollectionObjects = React.useCallback(
    (resolvedIds: RA<number>): void => {
      setCollectionObjectIds(resolvedIds);
      setSelectedPreviewRows(new Set<number>());
      if (resolvedIds.length === 0) {
        setStep('catalogNumbers');
        return;
      }
      setPreviewRunCount((count) => count + 1);
      setStep('determination');
    },
    []
  );

  const runLiveValidation = React.useCallback(
    (entries: RA<string>, entriesKey: string): void => {
      const requestToken = liveValidationRequestTokenRef.current + 1;
      liveValidationRequestTokenRef.current = requestToken;
      setIsLiveValidating(true);
      void resolveCatalogNumbers(entries, {
        validateOnly: true,
        errorMode: 'silent',
      })
        .then((data) => {
          if (
            requestToken !== liveValidationRequestTokenRef.current ||
            stepRef.current !== 'catalogNumbers'
          )
            return;
          setValidatedCatalogNumbersKey(entriesKey);
          setResolvedCollectionObjectIds(data.collectionObjectIds);
          setUnmatchedCatalogNumbers(data.unmatchedCatalogNumbers);
        })
        .catch(() => undefined)
        .finally(() => {
          if (requestToken !== liveValidationRequestTokenRef.current) return;
          setIsLiveValidating(false);
        });
    },
    [resolveCatalogNumbers]
  );

  const scheduleLiveValidation = React.useCallback(
    (immediate: boolean): void => {
      if (step !== 'catalogNumbers' || catalogNumberRanges.length === 0) return;

      if (liveValidationTimeoutRef.current !== undefined) {
        globalThis.clearTimeout(liveValidationTimeoutRef.current);
        liveValidationTimeoutRef.current = undefined;
      }
      if (validatedCatalogNumbersKey === catalogNumbersKey) return;

      if (immediate) {
        runLiveValidation(catalogNumberEntries, catalogNumbersKey);
        return;
      }

      liveValidationTimeoutRef.current = globalThis.setTimeout(() => {
        liveValidationTimeoutRef.current = undefined;
        runLiveValidation(catalogNumberEntries, catalogNumbersKey);
      }, liveValidationDebounceMs);
    },
    [
      step,
      catalogNumberRanges,
      validatedCatalogNumbersKey,
      catalogNumbersKey,
      runLiveValidation,
      catalogNumberEntries,
    ]
  );

  React.useEffect(() => {
    if (step !== 'catalogNumbers') {
      if (liveValidationTimeoutRef.current !== undefined) {
        globalThis.clearTimeout(liveValidationTimeoutRef.current);
        liveValidationTimeoutRef.current = undefined;
      }
      liveValidationRequestTokenRef.current += 1;
      setIsLiveValidating(false);
      return;
    }

    if (catalogNumberRanges.length === 0) {
      setUnmatchedCatalogNumbers([]);
      setResolvedCollectionObjectIds([]);
      setValidatedCatalogNumbersKey(catalogNumbersKey);
      return;
    }
    scheduleLiveValidation(false);
  }, [
    step,
    catalogNumberRanges,
    scheduleLiveValidation,
    catalogNumbersKey,
  ]);

  React.useEffect(() => {
    if (step !== 'catalogNumbers') return;
    if (catalogNumbers.trim().length === 0 || catalogNumberRanges.length > 0)
      setValidation([]);
    else setValidation(batchIdentifyText.noCatalogNumbersParsed());
  }, [step, catalogNumbers, catalogNumberRanges, setValidation]);

  React.useEffect(
    () => (): void => {
      if (liveValidationTimeoutRef.current !== undefined)
        globalThis.clearTimeout(liveValidationTimeoutRef.current);
      liveValidationRequestTokenRef.current += 1;
    },
    []
  );

  const handleRecordSetSelected = React.useCallback(
    (recordSet: SerializedResource<RecordSet>): void => {
      setIsRecordSetDialogOpen(false);
      loading(
        fetchRecordSetCollectionObjectIds(recordSet.id).then(
          (recordSetCollectionObjectIds) => {
            setUnmatchedCatalogNumbers([]);
            setResolvedCollectionObjectIds([]);
            setValidatedCatalogNumbersKey('');
            proceedWithCollectionObjects(recordSetCollectionObjectIds);
          }
        )
      );
    },
    [loading, proceedWithCollectionObjects]
  );

  const handleNext = React.useCallback((): void => {
    if (catalogNumberRanges.length === 0 || isResolving || isLiveValidating) return;

    if (validatedCatalogNumbersKey === catalogNumbersKey) {
      if (unmatchedCatalogNumbers.length > 0) return;
      proceedWithCollectionObjects(resolvedCollectionObjectIds);
      return;
    }

    setIsResolving(true);
    loading(
      resolveCatalogNumbers(catalogNumberEntries).then((data) => {
        setValidatedCatalogNumbersKey(catalogNumbersKey);
        setResolvedCollectionObjectIds(data.collectionObjectIds);
        setUnmatchedCatalogNumbers(data.unmatchedCatalogNumbers);
        if (data.unmatchedCatalogNumbers.length > 0) {
          setCollectionObjectIds([]);
          setStep('catalogNumbers');
          return;
        }
        proceedWithCollectionObjects(data.collectionObjectIds);
      })
        .finally(() => setIsResolving(false))
    );
  }, [
    catalogNumberRanges,
    isResolving,
    isLiveValidating,
    validatedCatalogNumbersKey,
    catalogNumbersKey,
    unmatchedCatalogNumbers,
    proceedWithCollectionObjects,
    resolvedCollectionObjectIds,
    loading,
    resolveCatalogNumbers,
    catalogNumberEntries,
  ]);

  const handleIdentify = React.useCallback(
    (): void => {
      if (collectionObjectIds.length === 0 || isIdentifying) return;
      setIsIdentifying(true);
      loading(
        ajax<BatchIdentifySaveResponse>('/api/specify/batch_identify/', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: {
            collectionObjectIds,
            determination: serializeResource(determination),
          },
          errorMode: 'dismissible',
        })
          .then(async ({ data }) => {
            const recordSet = await createBatchIdentifyRecordSet(
              data.collectionObjectIds
            ).catch(() => undefined);
            setCreatedRecordSet(recordSet);
            setShowSuccessDialog(true);
          })
          .finally(() => setIsIdentifying(false))
      );
    },
    [collectionObjectIds, isIdentifying, loading, determination]
  );

  const previewExtraButtons = React.useMemo(
    () => (
      <>
        <DataEntry.Search disabled={isIdentifying} onClick={showSearchDialog} />
        <DataEntry.Remove
          disabled={selectedPreviewRowsCount === 0 || isIdentifying}
          onClick={handleRemoveSelectedCollectionObjects}
        />
      </>
    ),
    [
      isIdentifying,
      showSearchDialog,
      selectedPreviewRowsCount,
      handleRemoveSelectedCollectionObjects,
    ]
  );

  if (showSuccessDialog)
    return (
      <Dialog
        buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
        header={batchIdentifyText.batchIdentify()}
        onClose={handleClose}
      >
        <div className="flex flex-col gap-2">
          <p>{batchIdentifyText.successMessage()}</p>
          {typeof createdRecordSet === 'object' ? (
            <Link.NewTab href={`/specify/record-set/${createdRecordSet.id}/`}>
              {localized(createdRecordSet.name)}
            </Link.NewTab>
          ) : undefined}
        </div>
      </Dialog>
    );

  return (
    <>
      <Dialog
        buttons={
          step === 'catalogNumbers' ? (
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Secondary
                disabled={isResolving || isLiveValidating}
                onClick={(): void => setIsRecordSetDialogOpen(true)}
              >
                {recordSetLabel}
              </Button.Secondary>
              <Button.Info
                disabled={
                  catalogNumberRanges.length === 0 ||
                  isResolving ||
                  isLiveValidating ||
                  unmatchedCatalogNumbers.length > 0
                }
                onClick={handleNext}
              >
                {commonText.next()}
              </Button.Info>
            </>
          ) : (
            <>
              <Button.Info onClick={(): void => setStep('catalogNumbers')}>
                {commonText.back()}
              </Button.Info>
              <Button.Info
                disabled={collectionObjectIds.length === 0 || isIdentifying}
                onClick={handleIdentify}
              >
                {batchIdentifyText.identify()}
              </Button.Info>
              <Button.DialogClose>{commonText.close()}</Button.DialogClose>
            </>
          )
        }
        className={{
          container: dialogClassNames.extraWideContainer,
        }}
        header={batchIdentifyText.batchIdentify()}
        icon={icons.batchEdit}
        onClose={handleClose}
      >
        {step === 'catalogNumbers' ? (
          <div className="flex flex-col gap-2">
            <p>{batchIdentifyText.instructions()}</p>
            <p className="font-semibold">{catalogNumberLabel}</p>
            <p>
              {commonText.countLine({
                resource: catalogNumberLabel,
                count: catalogNumberRanges.length,
              })}
            </p>
            <AutoGrowTextArea
              className="font-mono"
              forwardRef={validationRef}
              placeholder={batchIdentifyText.placeholder()}
              rows={12}
              spellCheck={false}
              value={catalogNumbers}
              onBlur={(): void => scheduleLiveValidation(true)}
              onValueChange={(value): void => {
                setCatalogNumbers(value);
                setUnmatchedCatalogNumbers([]);
                setResolvedCollectionObjectIds([]);
                setValidatedCatalogNumbersKey('');
              }}
            />
            {isLiveValidating && <p>{batchIdentifyText.validatingCatalogNumbers()}</p>}
            {unmatchedCatalogNumbers.length > 0 && (
              <div className="mt-2 space-y-1">
                <H3>{batchIdentifyText.catalogNumbersNotFound()}</H3>
                {unmatchedCatalogNumbers.map((catalogNumber, index) => (
                  <p key={index}>{catalogNumber}</p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col gap-2">
            <p>
              {commonText.countLine({
                resource: catalogNumberLabel,
                count: catalogNumberRanges.length,
              })}
            </p>
            <p>
              {commonText.countLine({
                resource: collectionObjectLabel,
                count: collectionObjectIds.length,
              })}
            </p>
            <p>{batchIdentifyText.determinationInstructions()}</p>
            {unmatchedCatalogNumbers.length > 0 && (
              <div className="space-y-1">
                <H3>{batchIdentifyText.catalogNumbersNotFound()}</H3>
                {unmatchedCatalogNumbers.map((catalogNumber, index) => (
                  <p key={index}>{catalogNumber}</p>
                ))}
              </div>
            )}
            <div className="grid min-h-0 flex-1 grid-rows-[minmax(20rem,1fr)_minmax(18rem,1fr)] gap-2">
              <div className="min-h-0 overflow-auto rounded border border-gray-300 dark:border-neutral-700">
                <ResourceView
                  dialog={false}
                  isDependent
                  isSubForm={false}
                  resource={determination}
                  onAdd={undefined}
                  onClose={handleClose}
                  onDeleted={undefined}
                  onSaved={undefined}
                  onSaving={undefined}
                />
              </div>
              <div
                className="flex min-h-0 overflow-hidden rounded border border-gray-300 dark:border-neutral-700"
                onClickCapture={handlePreviewPopOutClick}
              >
                <QueryResultsWrapper
                  createRecordSet={undefined}
                  extraButtons={previewExtraButtons}
                  fields={previewFields}
                  forceCollection={undefined}
                  queryResource={previewQuery}
                  queryRunCount={previewRunCount}
                  recordSetId={undefined}
                  selectedRows={[selectedPreviewRows, setSelectedPreviewRows]}
                  table={tables.CollectionObject}
                  onReRun={f.void}
                />
              </div>
            </div>
          </div>
        )}
      </Dialog>
      {isRecordSetDialogOpen && (
        <ReadOnlyContext.Provider value>
          <RecordSetsDialog
            table={tables.CollectionObject}
            onClose={(): void => setIsRecordSetDialogOpen(false)}
            onSelect={handleRecordSetSelected}
          />
        </ReadOnlyContext.Provider>
      )}
      {searchDialog}
      {typeof isVerificationDialogOpen === 'number' && (
        <ReadOnlyContext.Provider value>
          <RecordSelectorFromIds
            canRemove={false}
            defaultIndex={0}
            dialog="modal"
            ids={[isVerificationDialogOpen]}
            isDependent={false}
            isInRecordSet={false}
            newResource={undefined}
            table={tables.CollectionObject}
            title={tables.CollectionObject.label}
            totalCount={1}
            onAdd={undefined}
            onClone={undefined}
            onClose={(): void => setIsVerificationDialogOpen(undefined)}
            onDelete={undefined}
            onSaved={f.void}
            onSlide={undefined}
          />
        </ReadOnlyContext.Provider>
      )}
    </>
  );
}
