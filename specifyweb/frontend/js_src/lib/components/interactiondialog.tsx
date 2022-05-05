import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax } from '../ajax';
import type {
  CollectionObject,
  Disposal,
  DisposalPreparation,
  Gift,
  GiftPreparation,
  Loan,
  LoanPreparation,
  RecordSet,
} from '../datamodel';
import { f } from '../functools';
import { sortFunction } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { getResourceViewUrl } from '../resource';
import type { PreparationRow, Preparations } from '../specifyapi';
import {
  getPrepsAvailableForLoanCoIds,
  getPrepsAvailableForLoanRs,
} from '../specifyapi';
import type { LiteralField } from '../specifyfield';
import type { Collection, SpecifyModel } from '../specifymodel';
import { toTable } from '../specifymodel';
import type { IR, RA } from '../types';
import { filterArray } from '../types';
import type { InvalidParseResult, ValidParseResult } from '../uiparse';
import {
  getValidationAttributes,
  parseValue,
  pluralizeParser,
  resolveParser,
} from '../uiparse';
import { Button, H3, Link } from './basic';
import { AutoGrowTextArea } from './common';
import { LoadingContext } from './contexts';
import { useValidation } from './hooks';
import { Dialog } from './modaldialog';
import { PrepDialog } from './prepdialog';
import { RecordSetsDialog } from './recordsetsdialog';
import { ShowResource } from './resourceview';

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
    readonly recordSets: RA<SpecifyResource<RecordSet>>;
  }>;
  readonly model: SpecifyModel<Gift | Disposal | CollectionObject | Loan>;
  readonly searchField: LiteralField | undefined;
  readonly onClose: () => void;
  readonly action: {
    readonly model: SpecifyModel<Loan | Gift | Disposal>;
    readonly name?: string;
  };
  readonly itemCollection?: Collection<
    LoanPreparation | GiftPreparation | DisposalPreparation
  >;
}): JSX.Element {
  const [state, setState] = React.useState<
    | State<'MainState'>
    | State<'LoadingState'>
    | State<'LoanReturnDoneState', { result: string }>
    | State<
        'PreparationSelectState',
        {
          entries: Preparations;
          problems: IR<RA<string>>;
        }
      >
  >({ type: 'MainState' });

  const { parser, split, attributes } = React.useMemo(() => {
    const parser = pluralizeParser(resolveParser(searchField ?? {}));
    // Determine which delimiters are allowed
    const formatter = searchField?.getUiFormatter();
    const formatted =
      formatter?.fields.map((field) => field.value).join('') ?? '';
    const formatterHasSpaces = formatted.includes(' ');
    const formatterHasCommas = formatted.includes(',');
    const delimiters = filterArray([
      '\n',
      formatterHasSpaces ? undefined : ' ',
      formatterHasCommas ? undefined : ',',
    ]);
    return {
      parser,
      split: (values: string): RA<string> =>
        values
          .replace(new RegExp(delimiters.join('|'), 'g'), '\t')
          .split('\t')
          .map(f.trim)
          .filter(Boolean),
      attributes: getValidationAttributes(parser),
    };
  }, [searchField]);
  const { validationRef, inputRef, setValidation } =
    useValidation<HTMLTextAreaElement>();
  const [catalogNumbers, setCatalogNumbers] = React.useState<string>('');

  const loading = React.useContext(LoadingContext);

  function handleProceed(
    recordSet: SpecifyResource<RecordSet> | undefined
  ): void {
    const items = catalogNumbers.split('\t');
    if (model.name === 'Loan')
      loading(
        ajax('/interactions/loan_return_all/', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: {
            recordSetId: recordSet?.get('id') ?? undefined,
            loanNumbers: typeof recordSet === 'undefined' ? items : undefined,
          },
        }).then(({ data }) =>
          setState({
            type: 'LoanReturnDoneState',
            result: data[0],
          })
        )
      );
    else if (typeof recordSet === 'object')
      loading(
        getPrepsAvailableForLoanRs(recordSet.get('id')).then((data) =>
          availablePrepsReady(undefined, recordSet, data)
        )
      );
    else
      loading(
        (items.length > 0
          ? Promise.resolve([])
          : getPrepsAvailableForLoanCoIds('CatalogNumber', items)
        ).then((data) => availablePrepsReady(items, undefined, data))
      );
  }

  function availablePrepsReady(
    entries: RA<string> | undefined,
    recordSet: SpecifyResource<RecordSet> | undefined,
    prepsData: RA<PreparationRow>
  ) {
    // This is a really ugly piece of code:
    let missing: string[] = [];
    if (Array.isArray(entries)) {
      let index = 0;
      let offsetIndex = 0;
      while (offsetIndex < entries.length && index < prepsData.length) {
        if (entries[offsetIndex] != prepsData[index][0])
          missing.push(entries[offsetIndex]);
        else {
          const value = prepsData[index][0];
          while (++index < prepsData.length && prepsData[index][0] == value);
        }
        offsetIndex += 1;
      }
      if (offsetIndex < entries.length)
        missing = [...missing, ...entries.slice(offsetIndex)];
    }
    if (prepsData.length === 0) {
      if (
        typeof recordSet === 'undefined' &&
        typeof itemCollection === 'object'
      ) {
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
  ) =>
    setState({
      type: 'PreparationSelectState',
      entries: prepsData.map((prepData) => ({
        catalogNumber: prepData[0],
        taxon: prepData[1],
        preparationId: prepData[2],
        prepType: prepData[3],
        countAmount: prepData[4],
        loaned: f.maybe(prepData[5] ?? undefined, f.parseInt) ?? 0,
        gifted: f.maybe(prepData[6] ?? undefined, f.parseInt) ?? 0,
        exchanged: f.maybe(prepData[7] ?? undefined, f.parseInt) ?? 0,
        available: Number.parseInt(prepData[8]),
      })),
      problems,
    });

  const formatProblems = (
    prepsData: RA<PreparationRow>,
    missing: RA<string>
  ): IR<RA<string>> => ({
    ...(missing.length > 0 ? { [formsText('missing')]: missing } : {}),
    ...(prepsData.length === 0
      ? { [formsText('preparationsNotFound')]: [] }
      : {}),
  });

  return state.type === 'LoanReturnDoneState' ? (
    <Dialog
      header={formsText('returnedPreparations')}
      onClose={handleClose}
      buttons={commonText('close')}
    >
      {formsText('returnedAndSaved', state.result)}
    </Dialog>
  ) : state.type === 'PreparationSelectState' ? (
    Object.keys(state.problems).length === 0 ? (
      <PrepDialog
        preparations={state.entries}
        action={action}
        itemCollection={itemCollection}
        onClose={handleClose}
        // TODO: make this readOnly if don't have necessary permissions
        isReadOnly={false}
      />
    ) : (
      <>
        {formsText('problemsFound')}
        {Object.entries(state.problems).map(([header, problems], index) => (
          <React.Fragment key={index}>
            <H3>{header}</H3>
            {problems.map((problem, index) => (
              <p key={index}>{problem}</p>
            ))}
          </React.Fragment>
        ))}
        <div>
          <Button.Blue
            onClick={(): void =>
              setState({
                ...state,
                problems: {},
              })
            }
          >
            {commonText('ignore')}
          </Button.Blue>
        </div>
      </>
    )
  ) : state.type === 'ShowResource' ? (
    <ShowResource resource={state.resource} recordSet={undefined} />
  ) : (
    <RecordSetsDialog
      recordSetsPromise={recordSetsPromise}
      isReadOnly={true}
      onClose={handleClose}
      onSelect={handleProceed}
    >
      {({ children, totalCount }): JSX.Element => (
        <Dialog
          header={
            typeof itemCollection === 'object'
              ? formsText('addItems')
              : model.name === 'Loan'
              ? formsText('recordReturn', model.label)
              : formsText('createRecord', action.model.name)
          }
          onClose={handleClose}
          buttons={
            <>
              <Button.DialogClose>{commonText('close')}</Button.DialogClose>
              {typeof itemCollection === 'object' ? (
                <Button.Blue
                  onClick={(): void =>
                    availablePrepsReady(undefined, undefined, [])
                  }
                >
                  {formsText('noCollectionObjectCaption')}
                </Button.Blue>
              ) : model.name === 'Loan' || action.model.name === 'Loan' ? (
                <Link.Blue href={getResourceViewUrl('Loan')}>
                  {formsText('noPreparationsCaption')}
                </Link.Blue>
              ) : undefined}
            </>
          }
        >
          <details>
            <summary>{formsText('recordSetCaption', totalCount)}</summary>
            {children}
          </details>
          <details>
            <summary>
              {formsText('entryCaption', searchField?.label ?? '')}
            </summary>
            <div className="flex flex-col gap-2">
              <AutoGrowTextArea
                spellCheck={false}
                value={catalogNumbers}
                onValueChange={setCatalogNumbers}
                forwardRef={validationRef}
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

                  const parsed = (parseResults as RA<ValidParseResult>)
                    .filter(({ parsed }) => parsed !== null)
                    .map(({ parsed }) => (parsed as number | string).toString())
                    .sort(sortFunction(f.id))
                    .join('\n');
                  setCatalogNumbers(parsed);
                }}
                {...attributes}
              />
              <div>
                <Button.Blue
                  // Action-entry
                  disabled={
                    catalogNumbers.length === 0 ||
                    inputRef.current?.validity.valid !== true
                  }
                  onClick={(): void => handleProceed(undefined)}
                >
                  {commonText('next')}
                </Button.Blue>
              </div>
            </div>
          </details>
        </Dialog>
      )}
    </RecordSetsDialog>
  );
}
