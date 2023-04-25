import React from 'react';
import type { State } from 'typesafe-reducer';

import { useValidation } from '../../hooks/useValidation';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import { ajax } from '../../utils/ajax';
import type { PreparationRow, Preparations } from '../../utils/ajax/specifyApi';
import {
  getPrepsAvailableForLoanCoIds,
  getPrepsAvailableForLoanRs,
} from '../../utils/ajax/specifyApi';
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
import type { IR, RA, WritableArray } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import { toTable } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import { getResourceViewUrl } from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import type { LiteralField } from '../DataModel/specifyField';
import type { Collection, SpecifyModel } from '../DataModel/specifyModel';
import type {
  CollectionObject,
  Disposal,
  DisposalPreparation,
  Gift,
  GiftPreparation,
  Loan,
  LoanPreparation,
  RecordSet,
} from '../DataModel/types';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { Dialog } from '../Molecules/Dialog';
import { userPreferences } from '../Preferences/userPreferences';
import { RecordSetsDialog } from '../Toolbar/RecordSets';
import { PrepDialog } from './PrepDialog';

export function InteractionDialog({
  recordSetsPromise,
  model,
  searchField,
  onClose: handleClose,
  action,
  itemCollection,
}: {
  readonly recordSetsPromise: Promise<{
    readonly totalCount: number;
    readonly records: RA<SerializedResource<RecordSet>>;
  }>;
  readonly model: SpecifyModel<CollectionObject | Disposal | Gift | Loan>;
  readonly searchField: LiteralField | undefined;
  readonly onClose: () => void;
  readonly action: {
    readonly model: SpecifyModel<Disposal | Gift | Loan>;
    readonly name?: string;
  };
  readonly itemCollection?: Collection<
    DisposalPreparation | GiftPreparation | LoanPreparation
  >;
}): JSX.Element {
  const [state, setState] = React.useState<
    | State<
        'PreparationSelectState',
        {
          readonly entries: Preparations;
          readonly problems: IR<RA<string>>;
        }
      >
    | State<'LoanReturnDoneState', { readonly result: number }>
    | State<'MainState'>
  >({ type: 'MainState' });

  const { parser, split, attributes } = useParser(searchField);
  const { validationRef, inputRef, setValidation } =
    useValidation<HTMLTextAreaElement>();
  const [catalogNumbers, setCatalogNumbers] = React.useState<string>('');

  const loading = React.useContext(LoadingContext);

  function handleProceed(
    recordSet: SerializedResource<RecordSet> | undefined
  ): void {
    const items = catalogNumbers.split('\n');
    if (model.name === 'Loan')
      loading(
        ajax<readonly [preprsReturned: number, loansClosed: number]>(
          '/interactions/loan_return_all/',
          {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: {
              recordSetId: recordSet?.id ?? undefined,
              loanNumbers: recordSet === undefined ? items : undefined,
            },
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
        getPrepsAvailableForLoanRs(recordSet.id).then((data) =>
          availablePrepsReady(undefined, recordSet, data)
        )
      );
    else
      loading(
        (items.length === 0
          ? Promise.resolve([])
          : getPrepsAvailableForLoanCoIds('CatalogNumber', items)
        ).then((data) => availablePrepsReady(items, undefined, data))
      );
  }

  function availablePrepsReady(
    entries: RA<string> | undefined,
    recordSet: SerializedResource<RecordSet> | undefined,
    prepsData: RA<PreparationRow>
  ) {
    // This is a really ugly piece of code:
    let missing: WritableArray<string> = [];
    if (Array.isArray(entries)) {
      let index = 0;
      let offsetIndex = 0;
      while (offsetIndex < entries.length && index < prepsData.length) {
        if (entries[offsetIndex] == prepsData[index][0]) {
          const value = prepsData[index][0];
          while (++index < prepsData.length && prepsData[index][0] == value);
        } else {
          missing.push(entries[offsetIndex]);
        }
        offsetIndex += 1;
      }
      if (offsetIndex < entries.length)
        missing = [...missing, ...entries.slice(offsetIndex)];
    }
    if (prepsData.length === 0) {
      if (recordSet === undefined && typeof itemCollection === 'object') {
        const item = new itemCollection.model.specifyModel.Resource();
        f.maybe(toTable(item, 'LoanPreparation'), (loanPreparation) => {
          loanPreparation.set('quantityReturned', 0);
          loanPreparation.set('quantityResolved', 0);
        });
        itemCollection.add(item);
      } else showPrepSelectDlg(prepsData, formatProblems(prepsData, missing));
    } else showPrepSelectDlg(prepsData, {});
  }

  const showPrepSelectDlg = (
    prepsData: RA<PreparationRow>,
    problems: IR<RA<string>>
  ): void =>
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
        available: Number.parseInt(prepData[10]),
      })),
      problems,
    });

  const formatProblems = (
    prepsData: RA<PreparationRow>,
    missing: RA<string>
  ): IR<RA<string>> => ({
    ...(missing.length > 0 ? { [interactionsText.missing()]: missing } : {}),
    ...(prepsData.length === 0
      ? { [interactionsText.preparationsNotFound()]: [] }
      : {}),
  });

  return state.type === 'LoanReturnDoneState' ? (
    <Dialog
      buttons={commonText.close()}
      header={interactionsText.returnedPreparations({
        tablePreparation: schema.models.Preparation.label,
      })}
      onClose={handleClose}
    >
      {interactionsText.returnedAndSaved({
        count: state.result,
        tablePreparation: schema.models.Preparation.label,
      })}
    </Dialog>
  ) : state.type === 'PreparationSelectState' &&
    Object.keys(state.problems).length === 0 ? (
    <PrepDialog
      action={action}
      // BUG: make this readOnly if don't have necessary permissions
      isReadOnly={false}
      itemCollection={itemCollection}
      preparations={state.entries}
      onClose={handleClose}
    />
  ) : (
    <RecordSetsDialog
      isReadOnly
      recordSetsPromise={recordSetsPromise}
      onClose={handleClose}
      onSelect={handleProceed}
    >
      {({ children, totalCount }): JSX.Element => (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.close()}</Button.DialogClose>
              {typeof itemCollection === 'object' ? (
                <Button.Blue
                  onClick={(): void =>
                    availablePrepsReady(undefined, undefined, [])
                  }
                >
                  {interactionsText.addUnassociated()}
                </Button.Blue>
              ) : model.name === 'Loan' || action.model.name === 'Loan' ? (
                <Link.Blue href={getResourceViewUrl('Loan')}>
                  {interactionsText.withoutPreparations()}
                </Link.Blue>
              ) : undefined}
            </>
          }
          header={
            typeof itemCollection === 'object'
              ? interactionsText.addItems()
              : model.name === 'Loan'
              ? interactionsText.recordReturn({ modelName: model.label })
              : interactionsText.createRecord({ modelName: action.model.name })
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
                onBlur={(): void => {
                  const parseResults = split(catalogNumbers).map((value) =>
                    parseValue(parser, inputRef.current ?? undefined, value)
                  );
                  const errorMessages = parseResults
                    .filter(
                      (result): result is InvalidParseResult => !result.isValid
                    )
                    .map(({ reason, value }) => `${reason} (${value})`);
                  if (errorMessages.length > 0) {
                    setValidation(errorMessages);
                    return;
                  }

                  const parsed = f
                    .unique(
                      (parseResults as RA<ValidParseResult>)
                        .filter(({ parsed }) => parsed !== null)
                        .map(({ parsed }) =>
                          (parsed as number | string).toString()
                        )
                        .sort(sortFunction(f.id))
                    )
                    .join('\n');
                  setCatalogNumbers(parsed);
                }}
                onValueChange={setCatalogNumbers}
                {...attributes}
              />
              <div>
                <Button.Blue
                  disabled={
                    catalogNumbers.length === 0 ||
                    inputRef.current?.validity.valid !== true
                  }
                  onClick={(): void => handleProceed(undefined)}
                >
                  {commonText.next()}
                </Button.Blue>
              </div>
              {state.type === 'PreparationSelectState' &&
              Object.keys(state.problems).length > 0 ? (
                <>
                  {interactionsText.problemsFound()}
                  {Object.entries(state.problems).map(
                    ([header, problems], index) => (
                      <React.Fragment key={index}>
                        <H3>{header}</H3>
                        {problems.map((problem, index) => (
                          <p key={index}>{problem}</p>
                        ))}
                      </React.Fragment>
                    )
                  )}
                  <div>
                    <Button.Blue
                      onClick={(): void =>
                        setState({
                          ...state,
                          problems: {},
                        })
                      }
                    >
                      {commonText.ignore()}
                    </Button.Blue>
                  </div>
                </>
              ) : undefined}
            </div>
          </details>
        </Dialog>
      )}
    </RecordSetsDialog>
  );
}

function useParser(searchField: LiteralField | undefined): {
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
    const parser = pluralizeParser(resolveParser(searchField ?? {}));
    // Determine which delimiters are allowed
    const formatter = searchField?.getUiFormatter();
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
          .replaceAll(new RegExp(delimiters.join('|'), 'g'), '\t')
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
