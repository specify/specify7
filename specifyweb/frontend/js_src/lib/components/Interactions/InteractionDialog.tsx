import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { State } from 'typesafe-reducer';

import { useValidation } from '../../hooks/useValidation';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import { ajax } from '../../utils/ajax';
import { formData } from '../../utils/ajax/helpers';
import { f } from '../../utils/functools';
import type { Parser } from '../../utils/parser/definitions';
import {
  getValidationAttributes,
  pluralizeParser,
  resolveParser,
} from '../../utils/parser/definitions';
import type {
  InvalidParseResult,
  ValidParseResult,
} from '../../utils/parser/parse';
import { parseValue } from '../../utils/parser/parse';
import type { IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import type {
  AnyInteractionPreparation,
  AnySchema,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceViewUrl } from '../DataModel/resource';
import { serializeResource } from '../DataModel/serializers';
import type { LiteralField } from '../DataModel/specifyField';
import type { Collection, SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import type {
  Accession,
  DisposalPreparation,
  GiftPreparation,
  LoanPreparation,
  RecordSet,
} from '../DataModel/types';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { Dialog } from '../Molecules/Dialog';
import { userPreferences } from '../Preferences/userPreferences';
import { RecordSetsDialog } from '../Toolbar/RecordSets';
import type {
  InteractionWithPreps,
  PreparationData,
  PreparationRow,
} from './helpers';
import {
  getCatNumberAvailableForAccession,
  interactionsWithPrepTables,
} from './helpers';
import {
  getPrepsAvailableForLoanCoIds,
  getPrepsAvailableForLoanRs,
} from './helpers';
import { PrepDialog } from './PrepDialog';

export function InteractionDialog({
  onClose: handleClose,
  actionTable,
  isLoanReturn = false,
  itemCollection,
  interactionResource,
}: {
  readonly onClose: () => void;
  readonly actionTable:
    | SpecifyTable<Accession>
    | SpecifyTable<InteractionWithPreps>;
  readonly isLoanReturn?: boolean;
  readonly itemCollection?: Collection<AnyInteractionPreparation>;
  readonly interactionResource?: SpecifyResource<AnySchema>;
}): JSX.Element {
  const itemTable = isLoanReturn ? tables.Loan : tables.CollectionObject;
  const searchField = itemTable.strictGetLiteralField(
    itemTable.name === 'Loan' ? 'loanNumber' : 'catalogNumber'
  );
  const { parser, split, attributes } = useParser(searchField);

  const [state, setState] = React.useState<
    | State<
        'InvalidState',
        {
          readonly invalid: RA<string>;
        }
      >
    | State<
        'MissingState',
        {
          readonly missing: RA<string>;
          readonly unavailableBis: RA<string>;
        }
      >
    | State<
        'PreparationSelectState',
        {
          readonly entries: RA<PreparationData>;
        }
      >
    | State<'LoanReturnDoneState', { readonly result: number }>
    | State<'MainState'>
    | State<'UsedCatalogNumberState', { readonly unavailable: RA<string> }>
  >({ type: 'MainState' });

  const { validationRef, inputRef, setValidation } =
    useValidation<HTMLTextAreaElement>();
  const [catalogNumbers, setCatalogNumbers] = React.useState<string>('');

  const loading = React.useContext(LoadingContext);

  const isLoan = actionTable.name === 'Loan';

  function handleProceed(
    recordSet: SerializedResource<RecordSet> | undefined
  ): void {
    const catalogNumbers = handleParse();
    if (catalogNumbers === undefined) return undefined;
    if (isLoanReturn)
      loading(
        ajax<readonly [preprsReturned: number, loansClosed: number]>(
          '/interactions/loan_return_all/',
          {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: formData({
              recordSetId: recordSet?.id ?? undefined,
              loanNumbers: recordSet === undefined ? catalogNumbers : undefined,
            }),
            errorMode: 'dismissible',
          }
        ).then(({ data }) =>
          setState({
            type: 'LoanReturnDoneState',
            result: data[0],
          })
        )
      );
    else if (typeof recordSet === 'object')
      loading(
        getPrepsAvailableForLoanRs(recordSet.id, isLoan).then((data) =>
          availablePrepsReady(undefined, data)
        )
      );
    else
      loading(
        (catalogNumbers.length === 0
          ? Promise.resolve([])
          : getPrepsAvailableForLoanCoIds(
              'CatalogNumber',
              catalogNumbers,
              isLoan
            )
        ).then((data) => availablePrepsReady(catalogNumbers, data))
      );
  }

  const [prepsData, setPrepsData] = React.useState<RA<PreparationRow>>();

  function availablePrepsReady(
    entries: RA<string> | undefined,
    prepsData: RA<PreparationRow>
  ) {
    const catalogNumbers = prepsData.map(([catalogNumber]) => catalogNumber);
    const missing =
      typeof entries === 'object'
        ? entries.filter(
            (entry) => !catalogNumbers.some((data) => data.includes(entry))
          )
        : [];
    const unavailablePrep = prepsData.filter(
      (prepData) => Number.parseInt(prepData[10]) === 0
    );
    const availablePrep = prepsData.filter(
      (prepData) => Number.parseInt(prepData[10]) > 0
    );
    const unavailable =
      typeof entries === 'object'
        ? entries.filter((entry) =>
            unavailablePrep.some((item) => entry === item[0])
          )
        : [];

    if (missing.length > 0 || unavailable.length > 0) {
      setState({ type: 'MissingState', missing, unavailableBis: unavailable });
      setPrepsData(availablePrep);
    } else showPrepSelectDlg(availablePrep);
  }

  const showPrepSelectDlg = (prepsData: RA<PreparationRow>): void =>
    setState({
      type: 'PreparationSelectState',
      entries: prepsData.map((prepData) => ({
        catalogNumber: prepData[0],
        collectionObjectId: prepData[1],
        taxon: prepData[2],
        taxonId: prepData[3],
        preparationId: prepData[4],
        prepType: prepData[5],
        countAmount: prepData[6],
        loaned: f.parseInt(prepData[7] ?? undefined) ?? 0,
        gifted: f.parseInt(prepData[8] ?? undefined) ?? 0,
        exchanged: f.parseInt(prepData[9] ?? undefined) ?? 0,
        available: f.parseInt(prepData[10] ?? undefined) ?? 0,
      })),
    });

  function handleParse(): RA<string> | undefined {
    const parseResults = split(catalogNumbers).map((value) =>
      parseValue(parser, inputRef.current ?? undefined, value)
    );
    const errorMessages = parseResults
      .filter((result): result is InvalidParseResult => !result.isValid)
      .map(({ reason, value }) => `${reason} (${value})`);
    if (errorMessages.length > 0) {
      setValidation(errorMessages);
      setState({
        type: 'InvalidState',
        invalid: errorMessages,
      });
      return undefined;
    }

    const parsed = f.unique(
      (parseResults as RA<ValidParseResult>)
        .filter(({ parsed }) => parsed !== null)
        .map(({ parsed }) => (parsed as number | string).toString())
        .sort(sortFunction(f.id))
    );
    setCatalogNumbers(parsed.join('\n'));

    setState({ type: 'MainState' });
    return parsed;
  }

  const navigate = useNavigate();

  const addInteractionResource = (): void => {
    itemCollection?.add(
      (interactionResource as SpecifyResource<
        DisposalPreparation | GiftPreparation | LoanPreparation
      >) ?? new itemCollection.table.specifyTable.Resource()
    );
  };

  const [unavailableCatNumbers, setUnavailableCatNumbers] =
    React.useState<RA<string>>();
  const [availableCatNumbers, setAvailableCatNumbers] =
    React.useState<RA<string>>();
  const [availableData, setAvailableData] = React.useState<
    | RA<{
        readonly catalognumber: string;
        readonly id: number;
      }>
    | undefined
  >();

  const hanleAvailableCatNumber = (): void => {
    const catalogNumbers = handleParse();
    if (catalogNumbers === undefined) return undefined;

    loading(
      (catalogNumbers.length === 0
        ? Promise.resolve([])
        : // Add await for catNum promise
          getCatNumberAvailableForAccession('CatalogNumber', catalogNumbers)
      )
        .then((data) => {
          setAvailableData(data);

          const returnCOCatNumber = new Set(
            data.map((item) => item.catalognumber)
          );

          const availableCOs = catalogNumbers.filter((catNumber) =>
            returnCOCatNumber.has(catNumber)
          );
          const unavailableCOs = catalogNumbers.filter(
            (catNumber) => !returnCOCatNumber.has(catNumber)
          );
          setAvailableCatNumbers(availableCOs);
          setUnavailableCatNumbers(unavailableCOs);
          // Or move the if else here
          if (
            unavailableCatNumbers !== undefined &&
            unavailableCatNumbers.length > 0
          )
            setState({
              type: 'UsedCatalogNumberState',
              unavailable: unavailableCatNumbers,
            });
          else {
            // Const interaction = new actionTable.Resource();
            const interaction = new tables.Accession.Resource();

            const COs = data?.map((available) => {
              const id = available.id;
              const co = new tables.CollectionObject.Resource({ id });
              return co.set('accession', interaction);
            });
            COs.forEach((co) => {
              interaction.set('collectionObjects', co as never);
            });
            // Interaction.set('collectionObjects', COs as never);
            console.log(COs, interaction);

            navigate(getResourceViewUrl(actionTable.name, undefined), {
              state: {
                type: 'RecordSet',
                resource: serializeResource(interaction),
              },
            });
            // HandleClose();
          }
        })
        .catch((error) => {
          console.error('Error in handleAvailableCatNumber:', error);
        })
    );
  };

  return state.type === 'LoanReturnDoneState' ? (
    <Dialog
      buttons={commonText.close()}
      header={interactionsText.returnedPreparations({
        tablePreparation: tables.Preparation.label,
      })}
      onClose={handleClose}
    >
      {interactionsText.returnedAndSaved({
        count: state.result,
        tablePreparation: tables.Preparation.label,
      })}
    </Dialog>
  ) : state.type === 'PreparationSelectState' &&
    actionTable.name !== 'Accession' ? (
    state.entries.length > 0 ? (
      <PrepDialog
        // BUG: make this readOnly if don't have necessary permissions
        itemCollection={itemCollection}
        preparations={state.entries}
        table={actionTable}
        onClose={handleClose}
      />
    ) : (
      <Dialog
        buttons={
          <>
            <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
            {typeof itemCollection === 'object' ? (
              <Button.Info
                onClick={(): void => {
                  addInteractionResource();
                  handleClose();
                }}
              >
                {interactionsText.continueWithoutPreparations()}
              </Button.Info>
            ) : (
              <Link.Info href={getResourceViewUrl(actionTable.name)}>
                {interactionsText.continueWithoutPreparations()}
              </Link.Info>
            )}
            {}
          </>
        }
        header={interactionsText.returnedPreparations({
          tablePreparation: tables.Preparation.label,
        })}
        onClose={handleClose}
      >
        {interactionsText.noPreparationsWarning()}
      </Dialog>
    )
  ) : (
    <ReadOnlyContext.Provider value>
      <RecordSetsDialog
        table={itemTable}
        onClose={handleClose}
        onSelect={handleProceed}
      >
        {({ children, totalCount }): JSX.Element => (
          <Dialog
            buttons={
              <>
                {typeof itemCollection === 'object' ? (
                  <Button.Secondary
                    onClick={(): void => {
                      addInteractionResource();
                      handleClose();
                    }}
                  >
                    {interactionsText.addUnassociated()}
                  </Button.Secondary>
                ) : interactionsWithPrepTables.includes(actionTable.name) ||
                  actionTable.name === 'Accession' ? (
                  <Link.Secondary href={getResourceViewUrl(actionTable.name)}>
                    {actionTable.name === 'Accession'
                      ? interactionsText.continueWithoutCollectionObject()
                      : interactionsText.withoutPreparations()}
                  </Link.Secondary>
                ) : undefined}
                <span className="-ml-2 flex-1" />
                {state.type === 'MissingState' &&
                prepsData?.length !== 0 &&
                prepsData ? (
                  <Button.Info
                    onClick={(): void => {
                      showPrepSelectDlg(prepsData);
                    }}
                  >
                    {interactionsText.continue()}
                  </Button.Info>
                ) : null}
                <Button.DialogClose>{commonText.close()}</Button.DialogClose>
              </>
            }
            header={
              typeof itemCollection === 'object'
                ? interactionsText.addItems()
                : itemTable.name === 'Loan'
                ? interactionsText.recordReturn({ table: itemTable.label })
                : interactionsText.createRecord({ table: actionTable.name })
            }
            onClose={handleClose}
          >
            <details>
              <summary>
                {interactionsText.byChoosingRecordSet({ count: totalCount })}
              </summary>
              {children}
            </details>
            <details>
              <summary>
                {interactionsText.byEnteringNumbers({
                  fieldName: searchField?.label ?? '',
                })}
              </summary>
              <div className="flex flex-col gap-2">
                <AutoGrowTextArea
                  forwardRef={validationRef}
                  spellCheck={false}
                  value={catalogNumbers}
                  onValueChange={setCatalogNumbers}
                  {...attributes}
                />
                <div>
                  <Button.Info
                    disabled={catalogNumbers.length === 0}
                    onClick={(): void => {
                      if (actionTable.name === 'Accession') {
                        hanleAvailableCatNumber();
                      } else {
                        handleProceed(undefined);
                      }
                    }}
                  >
                    {state.type === 'MissingState' ||
                    state.type === 'InvalidState' ||
                    state.type === 'UsedCatalogNumberState'
                      ? commonText.update()
                      : commonText.next()}
                  </Button.Info>
                </div>
                {state.type === 'InvalidState' && (
                  <>
                    {interactionsText.problemsFound()}
                    {state.invalid.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </>
                )}
                {state.type === 'MissingState' && (
                  <>
                    {state.missing.length > 0 && (
                      <>
                        <H3>{interactionsText.preparationsNotFoundFor()}</H3>
                        {state.missing.map((problem, index) => (
                          <p key={index}>{problem}</p>
                        ))}
                      </>
                    )}
                    {state.unavailableBis.length > 0 && (
                      <>
                        <H3>
                          {interactionsText.preparationsNotAvailableFor()}
                        </H3>
                        {state.unavailableBis.map((problem, index) => (
                          <p key={index}>{problem}</p>
                        ))}
                      </>
                    )}
                  </>
                )}
                {state.type === 'UsedCatalogNumberState' && (
                  <>
                    {interactionsText.catalogNumberAlreadyUsed()}
                    {state.unavailable.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </>
                )}
              </div>
            </details>
          </Dialog>
        )}
      </RecordSetsDialog>
    </ReadOnlyContext.Provider>
  );
}

function useParser(searchField: LiteralField): {
  readonly parser: Parser;
  readonly split: (values: string) => RA<string>;
  readonly attributes: IR<string>;
} {
  const [useSpaceAsDelimiter] = userPreferences.use(
    'interactions',
    'createInteractions',
    'useSpaceAsDelimiter'
  );
  const [useCommaAsDelimiter] = userPreferences.use(
    'interactions',
    'createInteractions',
    'useCommaAsDelimiter'
  );
  const [useNewLineAsDelimiter] = userPreferences.use(
    'interactions',
    'createInteractions',
    'useNewLineAsDelimiter'
  );
  const [useCustomDelimiters] = userPreferences.use(
    'interactions',
    'createInteractions',
    'useCustomDelimiters'
  );

  return React.useMemo(() => {
    const parser = pluralizeParser(resolveParser(searchField));
    // Determine which delimiters are allowed
    const formatter = searchField.getUiFormatter();
    const formatted =
      formatter?.fields.map((field) => field.value).join('') ?? '';
    const formatterHasNewLine = formatted.includes('\n');
    const formatterHasSpaces = formatted.includes(' ');
    const formatterHasCommas = formatted.includes(',');
    const delimiters = filterArray([
      (useNewLineAsDelimiter === 'auto' && !formatterHasNewLine) ||
      useNewLineAsDelimiter === 'true'
        ? '\n'
        : undefined,
      (useSpaceAsDelimiter === 'auto' && !formatterHasSpaces) ||
      useSpaceAsDelimiter === 'true'
        ? ' '
        : undefined,
      (useCommaAsDelimiter === 'auto' && !formatterHasCommas) ||
      useCommaAsDelimiter === 'true'
        ? ','
        : undefined,
      ...(useCustomDelimiters.length === 0
        ? []
        : useCustomDelimiters.split('\n')),
    ]);
    return {
      parser,
      split: (values): RA<string> =>
        values
          .replaceAll(new RegExp(delimiters.join('|'), 'gu'), '\t')
          .split('\t')
          .map(f.trim)
          .filter(Boolean),
      attributes: getValidationAttributes(parser),
    };
  }, [
    searchField,
    useSpaceAsDelimiter,
    useCommaAsDelimiter,
    useNewLineAsDelimiter,
    useCustomDelimiters,
  ]);
}
