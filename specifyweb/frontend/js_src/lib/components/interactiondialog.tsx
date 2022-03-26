import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax } from '../ajax';
import type { CollectionObject, Loan, RecordSet } from '../datamodel';
import type { AnySchema, FilterTablesByEndsWith } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import PrepSelectDialog from '../prepselectdialog';
import { getResourceViewUrl } from '../resource';
import { getModel } from '../schema';
import {
  getPrepsAvailableForLoanCoIds,
  getPrepsAvailableForLoanRs,
} from '../specifyapi';
import type { LiteralField } from '../specifyfield';
import type { Collection, SpecifyModel } from '../specifymodel';
import { toTable } from '../specifymodel';
import * as s from '../stringlocalization';
import type { IR, RA } from '../types';
import { defined, filterArray } from '../types';
import type { InvalidParseResult, ValidParseResult } from '../uiparse';
import {
  getValidationAttributes,
  parseValue,
  pluralizeParser,
  resolveParser,
} from '../uiparse';
import { sortFunction } from '../helpers';
import { f } from '../functools';
import { Button, className, H3, Link, Textarea } from './basic';
import { useValidation } from './hooks';
import { Dialog } from './modaldialog';
import { RenderView } from './reactbackboneextend';
import { RecordSetsDialog } from './recordsetsdialog';
import { LoadingContext } from './contexts';

export function InteractionDialog({
  recordSetsPromise,
  model,
  searchField,
  onClose: handleClose,
  action,
  interactionResource,
  itemCollection,
}: {
  readonly recordSetsPromise: Promise<{
    readonly totalCount: number;
    readonly recordSets: RA<SpecifyResource<RecordSet>>;
  }>;
  readonly model: SpecifyModel<CollectionObject | Loan>;
  readonly searchField: LiteralField | undefined;
  readonly onClose: () => void;
  readonly action: {
    readonly model: SpecifyModel;
    readonly name?: string;
  };
  readonly interactionResource?: SpecifyResource<
    FilterTablesByEndsWith<'Preparation'>
  >;
  readonly itemCollection?: Collection<AnySchema>;
}): JSX.Element {
  const [state, setState] = React.useState<
    | State<'MainState'>
    | State<'LoadingState'>
    | State<'LoanReturnDoneState', { readonly result: string }>
    | State<
        'PreparationSelectState',
        {
          readonly entries: RA<IR<string>>;
          readonly problems: IR<RA<string>>;
        }
      >
  >({ type: 'MainState' });

  const { parser, split, attributes } = React.useMemo(() => {
    const parser = pluralizeParser(resolveParser(searchField ?? {}) ?? {});
    // Determine which delimiters are allowed
    const formatter = searchField?.getUiFormatter();
    const formatted =
      formatter?.fields.map((field) => field.value).join('') ?? '';
    const formatterHasSpaces = formatted.includes(' ');
    const formatterHasCommas = formatted.includes(',');
    const delimiters = filterArray([
      '\n',
      formatterHasSpaces ? undefined : ' ',
      formatterHasCommas ? undefined : '',
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
    prepsData: RA<RA<string>>
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
        typeof interactionResource === 'object'
      ) {
        const itemModelName = `${interactionResource.specifyModel.name}Preparation`;
        const itemModel = defined(getModel(itemModelName));
        const item = new itemModel.Resource();
        f.maybe(toTable(item, 'LoanPreparation'), (loanPreparation) => {
          loanPreparation.set('quantityReturned', 0);
          loanPreparation.set('quantityResolved', 0);
        });
        itemCollection?.add(item);
      } else showPrepSelectDlg(prepsData, formatProblems(prepsData, missing));
    } else showPrepSelectDlg(prepsData, {});
  }

  const showPrepSelectDlg = (
    prepsData: RA<RA<string>>,
    problems: IR<RA<string>>
  ) =>
    setState({
      type: 'PreparationSelectState',
      entries: prepsData.map((prepData) => ({
        catalognumber: prepData[0],
        taxon: prepData[1],
        preparationid: prepData[2],
        preptype: prepData[3],
        countamt: prepData[4],
        loaned: prepData[5],
        gifted: prepData[6],
        exchanged: prepData[7],
        available: prepData[8],
      })),
      problems,
    });

  const formatProblems = (
    prepsData: RA<RA<string>>,
    missing: RA<string>
  ): IR<RA<string>> => ({
    ...(missing.length > 0 ? { [formsText('missing')]: missing } : {}),
    ...(prepsData.length === 0
      ? { [formsText('preparationsNotFound')]: [] }
      : {}),
  });

  return state.type === 'LoanReturnDoneState' ? (
    <Dialog
      header={s.localize('InteractionsTask.LN_RET_TITLE')}
      onClose={handleClose}
      buttons={commonText('close')}
    >
      {s.localize('InteractionsTask.RET_LN_SV').replace('%d', state.result)}
    </Dialog>
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
            typeof interactionResource === 'object'
              ? formsText('addItems')
              : model.name === 'Loan'
              ? formsText('recordReturn')(model.label)
              : formsText('createRecord')(action.model.name)
          }
          onClose={handleClose}
          buttons={
            <>
              <Button.DialogClose>{commonText('close')}</Button.DialogClose>
              {typeof interactionResource === 'object' ? (
                <Button.Blue
                  onClick={(): void =>
                    availablePrepsReady(undefined, undefined, [])
                  }
                >
                  {formsText('noCollectionObjectCaption')}
                </Button.Blue>
              ) : model.name === 'Loan' || action.model.name === 'Loan' ? (
                <Link.LikeFancyButton
                  className={className.blueButton}
                  href={getResourceViewUrl('Loan')}
                >
                  {formsText('noPreparationsCaption')}
                </Link.LikeFancyButton>
              ) : undefined}
            </>
          }
        >
          <details>
            <summary>{formsText('recordSetCaption')(totalCount)}</summary>
            {children}
          </details>
          <details>
            <summary>
              {formsText('entryCaption')(searchField?.label ?? '')}
            </summary>
            <Textarea
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
          </details>
          {state.type === 'PreparationSelectState' ? (
            Object.keys(state.problems).length === 0 ? (
              <RenderView
                getView={(element) =>
                  new PrepSelectDialog({
                    el: element,
                    preps: state.entries,
                    action,
                    interactionresource: interactionResource,
                    itemcollection: itemCollection,
                  })
                }
              />
            ) : (
              <>
                ${formsText('problemsFound')}
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
                <Button.Blue
                  onClick={(): void =>
                    setState({
                      ...state,
                      problems: {},
                    })
                  }
                >
                  {formsText('ignoreAndContinue')}
                </Button.Blue>
              </>
            )
          ) : undefined}
        </Dialog>
      )}
    </RecordSetsDialog>
  );
}
