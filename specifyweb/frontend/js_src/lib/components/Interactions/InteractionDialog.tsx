import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { useValidation } from '../../hooks/useValidation';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
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
} from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceViewUrl } from '../DataModel/resource';
import type { LiteralField } from '../DataModel/specifyField';
import type { Collection, SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import type {
  DisposalPreparation,
  GiftPreparation,
  LoanPreparation,
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
  getPrepsAvailableForLoanRs,
  getPrepsForCoOrCog,
  interactionsWithPrepTables,
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
  readonly actionTable: SpecifyTable<InteractionWithPreps>;
  readonly isLoanReturn?: boolean;
  readonly itemCollection?: Collection<AnyInteractionPreparation>;
  readonly interactionResource?: SpecifyResource<AnySchema>;
}): JSX.Element {
  const itemTable = isLoanReturn ? tables.Loan : tables.CollectionObject;
  const searchField = itemTable.strictGetLiteralField(
    itemTable.name === 'Loan' ? 'loanNumber' : 'catalogNumber'
  );

  const [state, setState] = React.useState<
    | State<
        'MissingState',
        {
          // No preparations found for these records
          readonly missing: RA<string>;
          // No preparations for at least one type of prep for these records
          readonly unavailable: RA<string>;
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
  >({ type: 'MainState' });

  const loading = React.useContext(LoadingContext);

  const isLoan = actionTable.name === 'Loan';

  const [prepsData, setPrepsData] = React.useState<RA<PreparationRow>>();

  function availablePrepsReady(
    parsed: RA<string> | undefined,
    prepsData: RA<PreparationRow>,
    entryIndex: number = 0
  ) {
    const prepEntries = prepsData.map((prepData) => prepData[entryIndex]);

    const missing = Array.isArray(parsed)
      ? parsed.filter(
          (entry) =>
            !prepEntries.some((data) => data?.toString().includes(entry))
        )
      : [];
    const unavailablePrep = prepsData.filter(
      (prepData) => Number.parseInt(prepData[10]) === 0
    );
    const availablePreps = prepsData.filter(
      (prepData) => Number.parseInt(prepData[10]) > 0
    );
    const unavailable =
      typeof parsed === 'object'
        ? parsed.filter((entry) =>
            unavailablePrep.some((item) => entry === item[0])
          )
        : [];

    if (missing.length > 0 || unavailable.length > 0) {
      setState({ type: 'MissingState', missing, unavailable });
      setPrepsData(availablePreps);
      return { missing, unavailable };
    } else return void showPrepSelectDlg(availablePreps);
  }

  const showPrepSelectDlg = (prepsData: RA<PreparationRow>): void =>
    setState({
      type: 'PreparationSelectState',
      entries: prepsData.map((prepData) => ({
        catalogNumber: prepData[0],
        collectionObjectId: prepData[1],
        taxon: prepData[2] ?? undefined,
        taxonId: prepData[3] ?? undefined,
        preparationId: prepData[4],
        prepType: prepData[5],
        countAmount: prepData[6],
        loaned: f.parseInt(prepData[7] ?? undefined) ?? 0,
        gifted: f.parseInt(prepData[8] ?? undefined) ?? 0,
        exchanged: f.parseInt(prepData[9] ?? undefined) ?? 0,
        available: f.parseInt(prepData[10] ?? undefined) ?? 0,
        cogId: prepData[11] ?? undefined,
        cogName: prepData[12] ?? undefined,
        isConsolidated: prepData[13] === 1,
      })),
    });

  const addInteractionResource = (): void => {
    itemCollection?.add(
      (interactionResource as SpecifyResource<
        DisposalPreparation | GiftPreparation | LoanPreparation
      >) ?? new itemCollection.table.specifyTable.Resource()
    );
  };

  const recordSetTables = React.useMemo(
    () => [itemTable, tables.CollectionObjectGroup],
    [itemTable]
  );

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
  ) : state.type === 'PreparationSelectState' ? (
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
        tables={recordSetTables}
        onClose={handleClose}
        onSelect={(recordSet): void =>
          loading(
            getPrepsAvailableForLoanRs(recordSet.id, isLoan).then((data) =>
              availablePrepsReady(undefined, data)
            )
          )
        }
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
                ) : interactionsWithPrepTables.includes(actionTable.name) ? (
                  <Link.Secondary href={getResourceViewUrl(actionTable.name)}>
                    {interactionsText.withoutPreparations()}
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
            <InteractionTextEntry
              label={interactionsText.byEnteringNumbers({
                fieldName: `${tables.CollectionObjectGroup.label} ${tables.CollectionObjectGroup.strictGetField('name').label}`,
              })}
              searchField={tables.CollectionObjectGroup.strictGetLiteralField(
                'name'
              )}
              onSubmit={(parsed, handleMissing): void => {
                if (parsed === undefined) return;
                loading(
                  (parsed.length === 0
                    ? Promise.resolve([])
                    : getPrepsForCoOrCog(
                        'CollectionObjectGroup',
                        'name',
                        parsed,
                        isLoan
                      )
                  ).then((data) => {
                    const results = availablePrepsReady(parsed, data, 12);
                    if (results !== undefined)
                      handleMissing(results.missing, results.unavailable);
                  })
                );
              }}
            />
            <InteractionTextEntry
              label={interactionsText.byEnteringNumbers({
                fieldName: searchField?.label ?? '',
              })}
              searchField={searchField}
              onSubmit={(parsed, handleMissing): void => {
                if (parsed === undefined) return;
                loading(
                  (parsed.length === 0
                    ? Promise.resolve([])
                    : getPrepsForCoOrCog(
                        'CollectionObject',
                        'catalogNumber',
                        parsed,
                        isLoan
                      )
                  ).then((data) => {
                    const results = availablePrepsReady(parsed, data);
                    if (results !== undefined)
                      handleMissing(results.missing, results.unavailable);
                  })
                );
              }}
            />
          </Dialog>
        )}
      </RecordSetsDialog>
    </ReadOnlyContext.Provider>
  );
}

function InteractionTextEntry({
  label,
  searchField,
  onSubmit,
}: {
  readonly label: LocalizedString;
  readonly searchField: LiteralField;
  readonly onSubmit: (
    parsed: RA<string> | undefined,
    handleMissing: (missing: RA<string>, unavailable: RA<string>) => void
  ) => void;
}): JSX.Element {
  const [input, setInput] = React.useState<string>('');
  const { validationRef, inputRef, setValidation } =
    useValidation<HTMLTextAreaElement>();

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
          // No preparations found for these records
          readonly missing: RA<string>;
          // No preparations for at least one type of prep for these records
          readonly unavailable: RA<string>;
        }
      >
    | State<'MainState'>
  >({
    type: 'MainState',
  });

  function handleParse(input: string): RA<string> | undefined {
    const parseResults = split(input).map((value) =>
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
    setInput(parsed.join('\n'));

    setState({ type: 'MainState' });
    return parsed;
  }

  return (
    <details>
      <summary>{label}</summary>
      <div className="flex flex-col gap-2">
        <AutoGrowTextArea
          forwardRef={validationRef}
          spellCheck={false}
          value={input}
          onValueChange={setInput}
          {...attributes}
        />
        <div>
          <Button.Info
            disabled={input.length === 0}
            onClick={(): void =>
              onSubmit(
                handleParse(input),
                (missing: RA<string>, unavailable: RA<string>) =>
                  setState({
                    type: 'MissingState',
                    missing,
                    unavailable,
                  })
              )
            }
          >
            {state.type === 'InvalidState' || state.type === 'MissingState'
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
            {state.unavailable.length > 0 && (
              <>
                <H3>{interactionsText.preparationsNotAvailableFor()}</H3>
                {state.unavailable.map((problem, index) => (
                  <p key={index}>{problem}</p>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </details>
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
    const parser = pluralizeParser({
      ...resolveParser(searchField),
      required: false,
    });
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
