import React from 'react';

import { useValidation } from '../../hooks/useValidation';
import { batchIdentifyText } from '../../localization/batchIdentify';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { resourcesText } from '../../localization/resources';
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
import type { SerializedResource } from '../DataModel/helperTypes';
import {
  createResource,
  getResourceApiUrl,
  strictIdFromUrl,
} from '../DataModel/resource';
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
import { TreeDefinitionContext } from '../QueryComboBox/useTreeData';
import { OverlayContext } from '../Router/Router';
import { useSearchDialog } from '../SearchDialog';
import { RecordSetsDialog } from '../Toolbar/RecordSets';
import {
  parseCatalogNumberEntries,
  parseCatalogNumberRanges,
} from './parseCatalogNumbers';

type BatchIdentifyResolveResponse = {
  readonly collectionObjectIds: RA<number>;
  readonly currentDeterminationIds: RA<number>;
  readonly unmatchedCatalogNumbers: RA<string>;
  readonly hasMixedTaxonTrees: boolean;
  readonly taxonTreeGroups: RA<{
    readonly taxonTreeDefId: number | null;
    readonly taxonTreeName: string | null;
    readonly collectionObjectIds: RA<number>;
    readonly catalogNumbers: RA<string>;
    readonly collectionObjectTypeNames: RA<string>;
  }>;
};

type BatchIdentifyCollectionObjectValidationResponse = Pick<
  BatchIdentifyResolveResponse,
  'collectionObjectIds' | 'hasMixedTaxonTrees' | 'taxonTreeGroups'
>;

type BatchIdentifySaveResponse = {
  readonly createdCount: number;
  readonly collectionObjectIds: RA<number>;
  readonly determinationIds: RA<number>;
};

type Step = 'catalogNumbers' | 'determination';

const liveValidationDebounceMs = 1000;
const collectionObjectViewPathRe =
  /\/specify\/view\/collectionobject\/(\d+)\/?$/i;

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
    mappingPath: ['determinations', '#1', 'preferredTaxon', 'fullname'],
    sortType: undefined,
    isDisplay: true,
    filters: [anyFilter],
  },
  {
    id: 5,
    mappingPath: ['determinations', '#1', 'taxon', 'fullname'],
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
        type: 'trueOrNull',
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

const createDetermination = () =>
  new tables.Determination.Resource().set('isCurrent', true);

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
  const recordSetLabel = tables.RecordSet.label;
  const canCreateRecordSet = hasToolPermission('recordSets', 'create');

  const [step, setStep] = React.useState<Step>('catalogNumbers');
  const [catalogNumbers, setCatalogNumbers] = React.useState('');
  const [isIdentifying, setIsIdentifying] = React.useState(false);
  const [isResolving, setIsResolving] = React.useState(false);
  const [isLiveValidating, setIsLiveValidating] = React.useState(false);
  const [isRecordSetDialogOpen, setIsRecordSetDialogOpen] =
    React.useState(false);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] =
    React.useState<number>();
  const [collectionObjectIds, setCollectionObjectIds] = React.useState<
    RA<number>
  >([]);
  const [createdRecordSet, setCreatedRecordSet] = React.useState<
    SerializedResource<RecordSet> | undefined
  >(undefined);
  const [identifiedCollectionObjectIds, setIdentifiedCollectionObjectIds] =
    React.useState<RA<number>>([]);
  const [isCreatingRecordSet, setIsCreatingRecordSet] = React.useState(false);
  const [isBrowseAfterIdentifyOpen, setIsBrowseAfterIdentifyOpen] =
    React.useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [resolvedCollectionObjectIds, setResolvedCollectionObjectIds] =
    React.useState<RA<number>>([]);
  const [validatedCatalogNumbersKey, setValidatedCatalogNumbersKey] =
    React.useState('');
  const [unmatchedCatalogNumbers, setUnmatchedCatalogNumbers] = React.useState<
    RA<string>
  >([]);
  const [hasMixedTaxonTrees, setHasMixedTaxonTrees] = React.useState(false);
  const [taxonTreeGroups, setTaxonTreeGroups] = React.useState<
    BatchIdentifyResolveResponse['taxonTreeGroups']
  >([]);
  const [recordSetMixedTreeGroups, setRecordSetMixedTreeGroups] =
    React.useState<BatchIdentifyResolveResponse['taxonTreeGroups']>([]);
  const [selectedTaxonTreeDefUri, setSelectedTaxonTreeDefUri] = React.useState<
    string | undefined
  >(undefined);
  const [
    searchTreeCollectionObjectTypeIds,
    setSearchTreeCollectionObjectTypeIds,
  ] = React.useState<RA<number> | undefined>(undefined);
  const [previewRunCount, setPreviewRunCount] = React.useState(0);
  const [selectedPreviewRows, setSelectedPreviewRows] = React.useState<
    ReadonlySet<number>
  >(new Set());
  const [determination, setDetermination] = React.useState(createDetermination);
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

  React.useEffect(() => {
    if (selectedTaxonTreeDefUri === undefined) {
      setSearchTreeCollectionObjectTypeIds(undefined);
      return;
    }
    const selectedTaxonTreeDefId = strictIdFromUrl(selectedTaxonTreeDefUri);
    let isCancelled = false;
    setSearchTreeCollectionObjectTypeIds(undefined);
    void fetchCollection('CollectionObjectType', {
      domainFilter: true,
      limit: 0,
      orderBy: 'id',
      taxonTreeDef: selectedTaxonTreeDefId,
    })
      .then(({ records }) => {
        if (isCancelled) return;
        setSearchTreeCollectionObjectTypeIds(records.map(({ id }) => id));
      })
      .catch(() => {
        if (isCancelled) return;
        setSearchTreeCollectionObjectTypeIds([]);
      });
    return () => {
      isCancelled = true;
    };
  }, [selectedTaxonTreeDefUri]);

  const searchDialogExtraFilters = React.useMemo(() => {
    if (selectedTaxonTreeDefUri === undefined) return undefined;
    if (searchTreeCollectionObjectTypeIds === undefined) return undefined;
    return [
      {
        field: 'collectionObjectType',
        queryBuilderFieldPath: ['collectionObjectType', 'id'],
        isRelationship: true,
        isNot: false,
        operation: 'in',
        value:
          searchTreeCollectionObjectTypeIds.length === 0
            ? '-1'
            : searchTreeCollectionObjectTypeIds.join(','),
      },
    ] as const;
  }, [selectedTaxonTreeDefUri, searchTreeCollectionObjectTypeIds]);

  const isSearchTreeFilterLoading =
    selectedTaxonTreeDefUri !== undefined &&
    searchTreeCollectionObjectTypeIds === undefined;

  const handleAddCollectionObjects = React.useCallback(
    (resources: RA<{ readonly id: number }>): void => {
      const selectedIds = resources.map(({ id }) => id);
      if (selectedIds.length === 0) return;

      const applyIds = (candidateIds: RA<number>): void => {
        const mergedCollectionObjectIds = f.unique([
          ...collectionObjectIds,
          ...candidateIds,
        ]);
        if (mergedCollectionObjectIds.length === collectionObjectIds.length)
          return;
        setCollectionObjectIds(mergedCollectionObjectIds);
        setSelectedPreviewRows(new Set<number>());
        setPreviewRunCount((count) => count + 1);
      };

      if (
        selectedTaxonTreeDefUri === undefined ||
        searchTreeCollectionObjectTypeIds === undefined
      ) {
        applyIds(selectedIds);
        return;
      }

      const allowedTypeIds = new Set(searchTreeCollectionObjectTypeIds);
      loading(
        fetchCollection(
          'CollectionObject',
          {
            domainFilter: true,
            limit: 0,
          },
          {
            id__in: selectedIds.join(','),
          }
        ).then(({ records }) => {
          const allowedIds = records
            .filter(({ collectionObjectType }) => {
              if (typeof collectionObjectType !== 'string') return false;
              const typeId = strictIdFromUrl(collectionObjectType);
              return allowedTypeIds.has(typeId);
            })
            .map(({ id }) => id);
          applyIds(allowedIds);
        })
      );
    },
    [
      collectionObjectIds,
      loading,
      searchTreeCollectionObjectTypeIds,
      selectedTaxonTreeDefUri,
    ]
  );

  const { searchDialog, showSearchDialog } = useSearchDialog({
    extraFilters: searchDialogExtraFilters as never,
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
      const link = target.closest<HTMLAnchorElement>(
        'a.print\\:hidden[target="_blank"]'
      );
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
      ajax<BatchIdentifyResolveResponse>(
        '/api/specify/batch_identify/resolve/',
        {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: {
            catalogNumbers: entries,
            validateOnly: options.validateOnly === true,
          },
          errorMode: options.errorMode ?? 'dismissible',
        }
      ).then(({ data }) => data),
    []
  );

  const validateCollectionObjects = React.useCallback(
    async (
      collectionObjectIds: RA<number>
    ): Promise<BatchIdentifyCollectionObjectValidationResponse> =>
      ajax<BatchIdentifyCollectionObjectValidationResponse>(
        '/api/specify/batch_identify/validate_record_set/',
        {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: {
            collectionObjectIds,
          },
          errorMode: 'dismissible',
        }
      ).then(({ data }) => data),
    []
  );

  const proceedWithCollectionObjects = React.useCallback(
    (resolvedIds: RA<number>, taxonTreeDefId?: number | null): void => {
      setDetermination(createDetermination());
      setSelectedTaxonTreeDefUri(
        typeof taxonTreeDefId === 'number'
          ? getResourceApiUrl('TaxonTreeDef', taxonTreeDefId)
          : undefined
      );
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

  const handleBackToCatalogNumbers = React.useCallback((): void => {
    setDetermination(createDetermination());
    setSelectedTaxonTreeDefUri(undefined);
    setStep('catalogNumbers');
  }, []);

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
          setHasMixedTaxonTrees(data.hasMixedTaxonTrees);
          setTaxonTreeGroups(data.taxonTreeGroups);
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
      setHasMixedTaxonTrees(false);
      setTaxonTreeGroups([]);
      setValidatedCatalogNumbersKey(catalogNumbersKey);
      return;
    }
    scheduleLiveValidation(false);
  }, [step, catalogNumberRanges, scheduleLiveValidation, catalogNumbersKey]);

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
          async (recordSetCollectionObjectIds) => {
            if (recordSetCollectionObjectIds.length === 0) {
              setRecordSetMixedTreeGroups([]);
              setIsRecordSetDialogOpen(true);
              return;
            }
            return validateCollectionObjects(recordSetCollectionObjectIds).then(
              (validationData) => {
                if (validationData.hasMixedTaxonTrees) {
                  setRecordSetMixedTreeGroups(validationData.taxonTreeGroups);
                  return;
                }
                setRecordSetMixedTreeGroups([]);
                setUnmatchedCatalogNumbers([]);
                setResolvedCollectionObjectIds([]);
                setHasMixedTaxonTrees(false);
                setTaxonTreeGroups([]);
                setValidatedCatalogNumbersKey('');
                proceedWithCollectionObjects(
                  validationData.collectionObjectIds,
                  validationData.taxonTreeGroups[0]?.taxonTreeDefId
                );
              }
            );
          }
        )
      );
    },
    [loading, proceedWithCollectionObjects, validateCollectionObjects]
  );

  const handleCloseRecordSetTreeError = React.useCallback((): void => {
    setRecordSetMixedTreeGroups([]);
    setIsRecordSetDialogOpen(true);
  }, []);

  const handleNext = React.useCallback((): void => {
    if (catalogNumberRanges.length === 0 || isResolving) return;

    if (validatedCatalogNumbersKey === catalogNumbersKey) {
      if (unmatchedCatalogNumbers.length > 0) return;
      if (hasMixedTaxonTrees) return;
      proceedWithCollectionObjects(
        resolvedCollectionObjectIds,
        taxonTreeGroups[0]?.taxonTreeDefId
      );
      return;
    }

    setIsResolving(true);
    loading(
      resolveCatalogNumbers(catalogNumberEntries)
        .then((data) => {
          setValidatedCatalogNumbersKey(catalogNumbersKey);
          setResolvedCollectionObjectIds(data.collectionObjectIds);
          setUnmatchedCatalogNumbers(data.unmatchedCatalogNumbers);
          setHasMixedTaxonTrees(data.hasMixedTaxonTrees);
          setTaxonTreeGroups(data.taxonTreeGroups);
          if (data.hasMixedTaxonTrees) return;
          if (data.unmatchedCatalogNumbers.length > 0) {
            setCollectionObjectIds([]);
            setStep('catalogNumbers');
            return;
          }
          proceedWithCollectionObjects(
            data.collectionObjectIds,
            data.taxonTreeGroups[0]?.taxonTreeDefId
          );
        })
        .finally(() => setIsResolving(false))
    );
  }, [
    catalogNumberRanges,
    isResolving,
    validatedCatalogNumbersKey,
    catalogNumbersKey,
    unmatchedCatalogNumbers,
    hasMixedTaxonTrees,
    taxonTreeGroups,
    proceedWithCollectionObjects,
    resolvedCollectionObjectIds,
    loading,
    resolveCatalogNumbers,
    catalogNumberEntries,
  ]);

  const handleIdentify = React.useCallback((): void => {
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
        .then(({ data }) => {
          setCreatedRecordSet(undefined);
          setIdentifiedCollectionObjectIds(f.unique(data.collectionObjectIds));
          setShowSuccessDialog(true);
        })
        .finally(() => setIsIdentifying(false))
    );
  }, [collectionObjectIds, isIdentifying, loading, determination]);

  const handleCreateRecordSetAfterIdentify = React.useCallback((): void => {
    if (
      isCreatingRecordSet ||
      identifiedCollectionObjectIds.length === 0 ||
      typeof createdRecordSet === 'object'
    )
      return;
    setIsCreatingRecordSet(true);
    loading(
      createBatchIdentifyRecordSet(identifiedCollectionObjectIds)
        .then((recordSet) => {
          if (typeof recordSet === 'object') setCreatedRecordSet(recordSet);
        })
        .finally(() => setIsCreatingRecordSet(false))
    );
  }, [
    isCreatingRecordSet,
    identifiedCollectionObjectIds,
    createdRecordSet,
    loading,
  ]);

  const previewExtraButtons = React.useMemo(
    () => (
      <>
        <DataEntry.Search
          disabled={isIdentifying || isSearchTreeFilterLoading}
          onClick={showSearchDialog}
        />

        <DataEntry.Remove
          disabled={selectedPreviewRowsCount === 0 || isIdentifying}
          onClick={handleRemoveSelectedCollectionObjects}
        />
      </>
    ),
    [
      isIdentifying,
      isSearchTreeFilterLoading,
      showSearchDialog,
      selectedPreviewRowsCount,
      handleRemoveSelectedCollectionObjects,
    ]
  );

  if (showSuccessDialog)
    return (
      <>
        <Dialog
          buttons={
            <>
              {canCreateRecordSet && (
                <Button.Secondary
                  disabled={
                    isCreatingRecordSet ||
                    identifiedCollectionObjectIds.length === 0 ||
                    typeof createdRecordSet === 'object'
                  }
                  onClick={handleCreateRecordSetAfterIdentify}
                >
                  {queryText.createRecordSet({
                    recordSetTable: recordSetLabel,
                  })}
                </Button.Secondary>
              )}
              <Button.Info
                disabled={identifiedCollectionObjectIds.length === 0}
                onClick={(): void => setIsBrowseAfterIdentifyOpen(true)}
              >
                {queryText.browseInForms()}
              </Button.Info>
              <Button.DialogClose>{commonText.close()}</Button.DialogClose>
            </>
          }
          className={{
            container: dialogClassNames.narrowContainer,
          }}
          dimensionsKey={false}
          header={batchIdentifyText.batchIdentify()}
          icon={icons.clipboardCopy}
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
        {isBrowseAfterIdentifyOpen && (
          <ReadOnlyContext.Provider value>
            <RecordSelectorFromIds
              canRemove={false}
              defaultIndex={0}
              dialog="modal"
              ids={identifiedCollectionObjectIds}
              isDependent={false}
              isInRecordSet={false}
              newResource={undefined}
              table={tables.CollectionObject}
              title={commonText.colonLine({
                label: batchIdentifyText.batchIdentify(),
                value: tables.CollectionObject.label,
              })}
              totalCount={identifiedCollectionObjectIds.length}
              onAdd={undefined}
              onClone={undefined}
              onClose={(): void => setIsBrowseAfterIdentifyOpen(false)}
              onDelete={undefined}
              onSaved={f.void}
              onSlide={undefined}
            />
          </ReadOnlyContext.Provider>
        )}
      </>
    );

  return (
    <>
      <Dialog
        buttons={
          step === 'catalogNumbers' ? (
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <span className="-ml-2 flex-1" />
              <Button.Info
                disabled={isResolving || isLiveValidating}
                onClick={(): void => setIsRecordSetDialogOpen(true)}
              >
                {recordSetLabel}
              </Button.Info>
              <Button.Info
                disabled={
                  catalogNumberRanges.length === 0 ||
                  isResolving ||
                  unmatchedCatalogNumbers.length > 0
                }
                onClick={handleNext}
              >
                {commonText.next()}
              </Button.Info>
            </>
          ) : (
            <>
              <Button.DialogClose>{commonText.close()}</Button.DialogClose>
              <span className="-ml-2 flex-1" />
              <Button.Secondary onClick={handleBackToCatalogNumbers}>
                {commonText.back()}
              </Button.Secondary>
              <Button.Info
                disabled={collectionObjectIds.length === 0 || isIdentifying}
                onClick={handleIdentify}
              >
                {batchIdentifyText.identify()}
              </Button.Info>
            </>
          )
        }
        className={{
          container:
            step === 'catalogNumbers'
              ? dialogClassNames.narrowContainer
              : dialogClassNames.extraWideContainer,
        }}
        dimensionsKey={`batch-identify-${step}`}
        header={batchIdentifyText.batchIdentify()}
        icon={icons.clipboardCopy}
        onClose={handleClose}
      >
        {step === 'catalogNumbers' ? (
          <div className="flex flex-col gap-2">
            <p>{batchIdentifyText.instructions()}</p>
            <AutoGrowTextArea
              className="font-mono"
              forwardRef={validationRef}
              placeholder={batchIdentifyText.placeholder()}
              rows={4}
              spellCheck={false}
              value={catalogNumbers}
              onBlur={(): void => scheduleLiveValidation(true)}
              onValueChange={(value): void => {
                setCatalogNumbers(value);
                setUnmatchedCatalogNumbers([]);
                setResolvedCollectionObjectIds([]);
                setHasMixedTaxonTrees(false);
                setTaxonTreeGroups([]);
                setValidatedCatalogNumbersKey('');
              }}
            />
            {isLiveValidating && (
              <p>{batchIdentifyText.validatingCatalogNumbers()}</p>
            )}
            {hasMixedTaxonTrees && (
              <div className="space-y-1">
                <p>{resourcesText.selectDeterminationTaxon()}</p>
                {taxonTreeGroups.map((group) => (
                  <div
                    className="space-y-1 rounded border border-gray-300 p-2 dark:border-neutral-700"
                    key={group.taxonTreeDefId ?? 'none'}
                  >
                    <p className="font-semibold">
                      {`${
                        group.taxonTreeName ??
                        batchIdentifyText.unknownTaxonTree()
                      } (${group.collectionObjectIds.length})`}
                    </p>
                    <p>
                      {commonText.colonLine({
                        label: batchIdentifyText.collectionObjectTypes(),
                        value: group.collectionObjectTypeNames.join(', '),
                      })}
                    </p>
                    <Button.Info
                      onClick={(): void =>
                        proceedWithCollectionObjects(
                          group.collectionObjectIds,
                          group.taxonTreeDefId
                        )
                      }
                    >
                      {commonText.select()}
                    </Button.Info>
                  </div>
                ))}
              </div>
            )}
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
          <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
            {unmatchedCatalogNumbers.length > 0 && (
              <div className="space-y-1">
                <H3>{batchIdentifyText.catalogNumbersNotFound()}</H3>
                {unmatchedCatalogNumbers.map((catalogNumber, index) => (
                  <p key={index}>{catalogNumber}</p>
                ))}
              </div>
            )}
            <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(16rem,1fr)] gap-3">
              <div className="min-h-0 overflow-y-auto">
                <TreeDefinitionContext.Provider value={selectedTaxonTreeDefUri}>
                  <ResourceView
                    dialog={false}
                    isDependent
                    isSubForm
                    resource={determination}
                    onAdd={undefined}
                    onClose={handleClose}
                    onDeleted={undefined}
                    onSaved={undefined}
                    onSaving={undefined}
                  />
                </TreeDefinitionContext.Provider>
              </div>
              <div
                className="flex min-h-0 overflow-hidden rounded border border-gray-300 dark:border-neutral-700"
                onClickCapture={handlePreviewPopOutClick}
              >
                <ReadOnlyContext.Provider value>
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
                </ReadOnlyContext.Provider>
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
      {recordSetMixedTreeGroups.length > 0 && (
        <Dialog
          buttons={
            <Button.Info onClick={handleCloseRecordSetTreeError}>
              {commonText.close()}
            </Button.Info>
          }
          header={batchIdentifyText.invalidRecordSetTitle()}
          onClose={handleCloseRecordSetTreeError}
        >
          <div className="space-y-2">
            <p>{batchIdentifyText.invalidRecordSetMessage()}</p>
            <div className="space-y-1">
              {recordSetMixedTreeGroups.map((group) => (
                <p key={group.taxonTreeDefId ?? 'none'}>
                  {commonText.colonLine({
                    label:
                      group.taxonTreeName ??
                      batchIdentifyText.unknownTaxonTree(),
                    value: String(group.collectionObjectIds.length),
                  })}
                </p>
              ))}
            </div>
            <p>{batchIdentifyText.invalidRecordSetInstructions()}</p>
          </div>
        </Dialog>
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
