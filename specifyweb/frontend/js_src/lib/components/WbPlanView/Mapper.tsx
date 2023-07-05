/*
 * WbPlanView logic for when the application is in the Mapping State
 * (when base table is selected and headers are loaded)
 *
 * @module
 */

import React from 'react';
import type { State } from 'typesafe-reducer';

import { useUnloadProtect } from '../../hooks/navigation';
import { useErrorContext } from '../../hooks/useErrorContext';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { wbPlanText } from '../../localization/wbPlan';
import { wbText } from '../../localization/workbench';
import { getCache } from '../../utils/cache';
import { listen } from '../../utils/events';
import type { IR, RA } from '../../utils/types';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import { strictGetModel } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { TableIcon } from '../Molecules/TableIcon';
import { smoothScroll } from '../QueryBuilder/helpers';
import { Layout } from './Header';
import {
  fetchAutoMapperSuggestions,
  getMappedFields,
  getMustMatchTables,
  mappingPathIsComplete,
} from './helpers';
import type { MappingElementProps } from './LineComponents';
import { getMappingLineProps, MappingLineComponent } from './LineComponents';
import { columnOptionsAreDefault } from './linesGetter';
import {
  ChangeBaseTable,
  EmptyDataSetDialog,
  mappingOptionsMenu,
  MappingsControlPanel,
  MappingView,
  MustMatch,
  ReRunAutoMapper,
  ToggleMappingPath,
  ValidationResults,
} from './MapperComponents';
import { reducer } from './mappingReducer';
import { findRequiredMissingFields } from './modelHelpers';
import { getMappingLineData } from './navigator';
import type { ColumnOptions } from './uploadPlanParser';
import type { Dataset } from './Wrapped';

/*
 * Scope is used to differentiate between mapper definitions that should
 * be used by the autoMapper and suggestion boxes
 */
export type AutoMapperScope =
  // Used when selecting a base table
  | 'autoMapper'
  // Suggestion boxes - used when opening a picklist
  | 'suggestion';

// All mapping path parts are expected to be in lower case
export type MappingPath = RA<string>;

export type SelectElementPosition = {
  readonly line: number;
  readonly index: number;
};

export type MappingLine = {
  readonly headerName: string;
  readonly mappingPath: MappingPath;
  readonly columnOptions: ColumnOptions;
  readonly isFocused?: boolean;
};

export type AutoMapperSuggestion = {
  readonly mappingLineData: RA<MappingElementProps>;
  readonly mappingPath: MappingPath;
};

export type MappingState = State<
  'MappingState',
  {
    readonly showMappingView: boolean;
    readonly showHiddenFields: boolean;
    readonly mappingView: MappingPath;
    readonly mappingsAreValidated: boolean;
    readonly lines: RA<MappingLine>;
    readonly focusedLine: number;
    readonly changesMade: boolean;
    readonly mustMatchPreferences: IR<boolean>;
    readonly autoMapperSuggestions?: RA<AutoMapperSuggestion>;
    readonly openSelectElement?: SelectElementPosition;
    readonly validationResults: RA<MappingPath>;
  }
>;

export const getDefaultMappingState = ({
  changesMade,
  lines,
  mustMatchPreferences,
}: {
  readonly changesMade: boolean;
  readonly lines: RA<MappingLine>;
  readonly mustMatchPreferences: IR<boolean>;
}): MappingState => ({
  type: 'MappingState',
  showHiddenFields: getCache('wbPlanViewUi', 'showHiddenFields') ?? false,
  showMappingView: getCache('wbPlanViewUi', 'showMappingView') ?? true,
  mappingView: ['0'],
  mappingsAreValidated: false,
  validationResults: [],
  lines,
  focusedLine: 0,
  changesMade,
  mustMatchPreferences,
});

// REFACTOR: split component into smaller components
export function Mapper(props: {
  readonly isReadOnly: boolean;
  readonly dataset: Dataset;
  readonly baseTableName: keyof Tables;
  readonly onChangeBaseTable: () => void;
  readonly onSave: (
    lines: RA<MappingLine>,
    mustMatchPreferences: IR<boolean>
  ) => Promise<void>;
  // Initial values for the state:
  readonly changesMade: boolean;
  readonly lines: RA<MappingLine>;
  readonly mustMatchPreferences: IR<boolean>;
}): JSX.Element {
  const [state, dispatch] = React.useReducer(
    reducer,
    {
      changesMade: props.changesMade,
      lines: props.lines,
      mustMatchPreferences: props.mustMatchPreferences,
    },
    getDefaultMappingState
  );
  useErrorContext('state', state);

  const unsetUnloadProtect = useUnloadProtect(
    state.changesMade,
    wbPlanText.unloadProtectMessage()
  );

  // Set/unset unload protect

  const getMappedFieldsBind = getMappedFields.bind(undefined, state.lines);
  const listOfMappings = React.useRef<HTMLUListElement>(null);

  // Reposition suggestions box if it doesn't fit
  function repositionSuggestionBox(): void {
    /*
     * REFACTOR: replace this with this hack?
     *   https://stackoverflow.com/questions/9364203/position-fixed-div-is-not-fixed-when-parent-rotates-or-translates
     *   alternatively, I may get away with not setting "top" at all and just
     *   letting browser do the positioning (while still having position:fixed)
     */
    if (
      state.autoMapperSuggestions === undefined ||
      state.autoMapperSuggestions.length === 0
    )
      return;

    if (listOfMappings.current === null) return;

    const autoMapperSuggestions = listOfMappings.current.getElementsByClassName(
      'custom-select-suggestion-list'
    )[0] as HTMLElement | undefined;

    if (!autoMapperSuggestions) return;

    const customSelectElement = autoMapperSuggestions.parentElement;

    if (!customSelectElement) return;

    const listOfMappingsPosition = listOfMappings.current.offsetTop;
    const currentScrollTop = listOfMappings.current.scrollTop;
    const picklistPosition = customSelectElement.offsetTop;

    const scrollPosition =
      picklistPosition - currentScrollTop - listOfMappingsPosition;

    const suggestionsListPosition =
      picklistPosition - autoMapperSuggestions.clientHeight - currentScrollTop;

    // Hide suggestions box once its parent picklist becomes hidden
    autoMapperSuggestions.style.visibility =
      scrollPosition > 0 ? 'visible' : 'hidden';

    if (scrollPosition > 0)
      autoMapperSuggestions.style.top = `${suggestionsListPosition}px`;
  }

  React.useEffect(repositionSuggestionBox, [
    state.autoMapperSuggestions,
    listOfMappings,
  ]);

  React.useEffect(
    () => listen(globalThis, 'resize', repositionSuggestionBox),
    []
  );

  // Fetch automapper suggestions when opening a custom select element
  React.useEffect(() => {
    if (
      state.openSelectElement === undefined ||
      state.lines[state.openSelectElement.line].mappingPath[
        state.openSelectElement.index
      ] === undefined
    )
      return undefined;

    fetchAutoMapperSuggestions({
      lines: state.lines,
      line: state.openSelectElement.line,
      index: state.openSelectElement.index,
      baseTableName: props.baseTableName,
    })
      .then((autoMapperSuggestions) =>
        destructorCalled
          ? undefined
          : dispatch({
              type: 'AutoMapperSuggestionsLoadedAction',
              autoMapperSuggestions,
            })
      )
      .catch(softFail);

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [state.openSelectElement, props.baseTableName]);

  const id = useId('wbplanviewmapper');

  const validate = (): RA<MappingPath> =>
    findRequiredMissingFields(
      props.baseTableName,
      state.lines
        .map(({ mappingPath }) => mappingPath)
        .filter(mappingPathIsComplete),
      state.mustMatchPreferences
    );

  const loading = React.useContext(LoadingContext);

  function handleSave(ignoreValidation: boolean): void {
    const validationResults = ignoreValidation ? [] : validate();
    if (validationResults.length === 0) {
      unsetUnloadProtect();
      loading(props.onSave(state.lines, state.mustMatchPreferences));
    } else
      dispatch({
        type: 'ValidationAction',
        validationResults,
      });
  }

  const handleClose = (): void =>
    dispatch({
      type: 'CloseSelectElementAction',
    });

  const mapButtonEnabled =
    !props.isReadOnly &&
    state.lines.length > 0 &&
    mappingPathIsComplete(state.mappingView) &&
    getMappedFieldsBind(state.mappingView).length === 0;

  return (
    <Layout
      buttonsLeft={
        props.isReadOnly ? undefined : (
          <>
            <ChangeBaseTable onClick={props.onChangeBaseTable} />
            <Button.Small
              aria-haspopup="dialog"
              onClick={(): void =>
                dispatch({
                  type: 'ResetMappingsAction',
                })
              }
            >
              {wbPlanText.clearMappings()}
            </Button.Small>
            <ReRunAutoMapper
              showConfirmation={(): boolean =>
                state.lines.some(({ mappingPath }) =>
                  mappingPathIsComplete(mappingPath)
                )
              }
              onClick={(): void =>
                dispatch({
                  type: 'ReRunAutoMapperAction',
                  baseTableName: props.baseTableName,
                })
              }
            />
          </>
        )
      }
      buttonsRight={
        <>
          <ToggleMappingPath
            showMappingView={state.showMappingView}
            onClick={(): void =>
              dispatch({
                type: 'ToggleMappingViewAction',
                isVisible: !state.showMappingView,
              })
            }
          />
          <MustMatch
            getMustMatchPreferences={(): IR<boolean> =>
              getMustMatchTables({
                baseTableName: props.baseTableName,
                lines: state.lines,
                mustMatchPreferences: state.mustMatchPreferences,
              })
            }
            isReadOnly={props.isReadOnly}
            onChange={(mustMatchPreferences): void =>
              dispatch({
                type: 'MustMatchPrefChangeAction',
                mustMatchPreferences,
              })
            }
            onClose={(): void => {
              /*
               * Since setting table as must match causes all of its fields to
               * be optional, we may have to rerun validation on
               * mustMatchPreferences changes
               */
              if (
                state.validationResults.length > 0 &&
                state.lines.some(({ mappingPath }) =>
                  mappingPathIsComplete(mappingPath)
                )
              )
                dispatch({
                  type: 'ValidationAction',
                  validationResults: validate(),
                });
            }}
          />
          {!props.isReadOnly && (
            <Button.Small
              className={
                state.mappingsAreValidated
                  ? 'bg-green-400 dark:bg-green-700'
                  : undefined
              }
              disabled={state.lines.every(
                ({ mappingPath }) => !mappingPathIsComplete(mappingPath)
              )}
              role="menuitem"
              onClick={(): void =>
                dispatch({
                  type: 'ValidationAction',
                  validationResults: validate(),
                })
              }
            >
              {wbText.validate()}
            </Button.Small>
          )}
          <Link.Small
            aria-haspopup="dialog"
            href={`/specify/workbench/${props.dataset.id}/`}
          >
            {props.isReadOnly ? wbText.dataEditor() : commonText.cancel()}
          </Link.Small>
          {!props.isReadOnly && (
            <Button.Small
              disabled={!state.changesMade}
              onClick={(): void => handleSave(false)}
            >
              {commonText.save()}
            </Button.Small>
          )}
        </>
      }
      title={
        <>
          <TableIcon label name={props.baseTableName} />
          <span title={wbText.dataSetName()}>{props.dataset.name}</span>
          <span title={wbPlanText.baseTable()}>
            {` (${strictGetModel(props.baseTableName).label})`}
          </span>
          {props.dataset.uploadresult?.success === true && (
            <span
              className="flex items-center text-red-600"
              title={wbPlanText.dataSetUploadedDescription()}
            >
              {` ${wbPlanText.dataSetUploaded()}`}
            </span>
          )}
        </>
      }
      onClick={handleClose}
    >
      {!props.isReadOnly && state.validationResults.length > 0 && (
        <ValidationResults
          baseTableName={props.baseTableName}
          getMappedFields={getMappedFieldsBind}
          mustMatchPreferences={state.mustMatchPreferences}
          validationResults={state.validationResults}
          onDismissValidation={(): void =>
            dispatch({
              type: 'ClearValidationAction',
            })
          }
          onSave={(): void => handleSave(true)}
          onValidationResultClick={(mappingPath: MappingPath): void =>
            dispatch({
              type: 'ValidationResultClickAction',
              mappingPath,
            })
          }
        />
      )}
      {state.showMappingView && (
        <MappingView
          mappingElementProps={getMappingLineProps({
            mappingLineData: getMappingLineData({
              baseTableName: props.baseTableName,
              mappingPath: state.mappingView,
              getMappedFields: getMappedFieldsBind,
              showHiddenFields: state.showHiddenFields,
              mustMatchPreferences: state.mustMatchPreferences,
              generateFieldData: 'all',
            }),
            customSelectType: 'OPENED_LIST',
            onChange({ isDoubleClick, ...rest }) {
              if (isDoubleClick && mapButtonEnabled)
                dispatch({ type: 'MappingViewMapAction' });
              else if (!props.isReadOnly)
                dispatch({
                  type: 'ChangeSelectElementValueAction',
                  line: 'mappingView',
                  ...rest,
                });
            },
          })}
        >
          <Button.Small
            className="flex-col justify-center p-2"
            disabled={!mapButtonEnabled}
            title={wbPlanText.mapButtonDescription()}
            onClick={(): void => dispatch({ type: 'MappingViewMapAction' })}
          >
            {wbPlanText.map()}
            <span
              aria-hidden="true"
              className={`
                text-green-500
                ${mapButtonEnabled ? '' : 'invisible'}
              `}
            >
              &#8594;
            </span>
          </Button.Small>
        </MappingView>
      )}

      <Ul
        aria-label={wbPlanText.mappings()}
        className={`
          grid flex-1 auto-rows-max grid-cols-[theme(spacing.8)_max-content_auto]
          overflow-x-hidden
          print:grid-cols-[min-content_auto]
        `}
        forwardRef={listOfMappings}
        tabIndex={-1}
        onScroll={repositionSuggestionBox}
      >
        {state.lines.map(({ mappingPath, headerName, columnOptions }, line) => {
          const handleOpen = (index: number): void =>
            dispatch({
              type: 'OpenSelectElementAction',
              line,
              index,
            });

          const openSelectElement =
            state.openSelectElement?.line === line
              ? state.openSelectElement.index
              : undefined;

          const lineData = getMappingLineProps({
            customSelectType: 'CLOSED_LIST',
            onChange: props.isReadOnly
              ? undefined
              : (payload): void =>
                  dispatch({
                    type: 'ChangeSelectElementValueAction',
                    line,
                    ...payload,
                  }),
            onOpen: handleOpen,
            onClose: handleClose,
            onAutoMapperSuggestionSelection: props.isReadOnly
              ? undefined
              : (suggestion: string): void =>
                  dispatch({
                    type: 'AutoMapperSuggestionSelectedAction',
                    suggestion,
                  }),
            openSelectElement,
            autoMapperSuggestions:
              (!props.isReadOnly && state.autoMapperSuggestions) || [],
            mappingLineData: getMappingLineData({
              baseTableName: props.baseTableName,
              mappingPath,
              getMappedFields: getMappedFieldsBind,
              showHiddenFields: state.showHiddenFields,
              mustMatchPreferences: state.mustMatchPreferences,
              generateFieldData: 'all',
            }),
          });

          // Add column options at the end of the line
          const fullLineData = mappingPathIsComplete(mappingPath)
            ? [
                ...lineData,
                {
                  customSelectType: 'OPTIONS_LIST',
                  customSelectSubtype: 'simple',
                  fieldsData: mappingOptionsMenu({
                    id: (suffix) => id(`column-options-${line}-${suffix}`),
                    isReadOnly: props.isReadOnly,
                    columnOptions,
                    onChangeMatchBehaviour: (matchBehavior) =>
                      dispatch({
                        type: 'ChangeMatchBehaviorAction',
                        line,
                        matchBehavior,
                      }),
                    onToggleAllowNulls: (allowNull) =>
                      dispatch({
                        type: 'ToggleAllowNullsAction',
                        line,
                        allowNull,
                      }),
                    onChangeDefaultValue: (defaultValue) =>
                      dispatch({
                        type: 'ChangeDefaultValueAction',
                        line,
                        defaultValue,
                      }),
                  }),
                  previewOption: {
                    optionName: 'mappingOptions',
                    optionLabel: (
                      <span title={wbPlanText.mappingOptions()}>
                        <span className="sr-only">
                          {wbPlanText.mappingOptions()}
                        </span>
                        {icons.cog}
                      </span>
                    ),
                    tableName: undefined,
                    isRelationship: !columnOptionsAreDefault(columnOptions),
                  },
                  selectLabel: wbPlanText.mappingOptions(),
                  ...(openSelectElement === lineData.length
                    ? {
                        isOpen: true,
                        onChange: undefined,
                        onClose: handleClose?.bind(undefined, lineData.length),
                      }
                    : {
                        isOpen: false,
                        onOpen: handleOpen?.bind(undefined, lineData.length),
                      }),
                } as const,
              ]
            : lineData;

          return (
            <ErrorBoundary dismissible key={line}>
              <MappingLineComponent
                headerName={headerName}
                isFocused={line === state.focusedLine}
                isReadOnly={props.isReadOnly}
                lineData={fullLineData}
                // Same key bindings as in QueryBuilder
                onClearMapping={(): void =>
                  dispatch({
                    type: 'ClearMappingLineAction',
                    line,
                  })
                }
                onFocus={(): void =>
                  dispatch({
                    type: 'FocusLineAction',
                    line,
                  })
                }
                onKeyDown={(key): void => {
                  const openSelectElement =
                    state.openSelectElement?.line === line
                      ? state.openSelectElement.index
                      : undefined;

                  if (typeof openSelectElement === 'number') {
                    if (key === 'ArrowLeft')
                      if (openSelectElement > 0)
                        handleOpen(openSelectElement - 1);
                      else
                        dispatch({
                          type: 'CloseSelectElementAction',
                        });
                    else if (key === 'ArrowRight')
                      if (openSelectElement + 1 < fullLineData.length)
                        handleOpen(openSelectElement + 1);
                      else
                        dispatch({
                          type: 'CloseSelectElementAction',
                        });

                    return;
                  }

                  if (key === 'ArrowLeft') handleOpen(fullLineData.length - 1);
                  else if (key === 'ArrowRight' || key === 'Enter')
                    handleOpen(0);
                  else if (key === 'ArrowUp' && line > 0)
                    dispatch({
                      type: 'FocusLineAction',
                      line: line - 1,
                    });
                  else if (key === 'ArrowDown' && line + 1 < state.lines.length)
                    dispatch({
                      type: 'FocusLineAction',
                      line: line + 1,
                    });
                }}
              />
            </ErrorBoundary>
          );
        })}
      </Ul>

      <MappingsControlPanel
        showHiddenFields={state.showHiddenFields}
        onAddNewHeader={
          props.isReadOnly
            ? undefined
            : (newHeaderName): void => {
                dispatch({ type: 'AddNewHeaderAction', newHeaderName });
                // Scroll listOfMappings to the bottom
                if (listOfMappings.current)
                  smoothScroll(
                    listOfMappings.current,
                    listOfMappings.current.scrollHeight
                  );
              }
        }
        onToggleHiddenFields={(): void =>
          dispatch({ type: 'ToggleHiddenFieldsAction' })
        }
      />
      <EmptyDataSetDialog lineCount={state.lines.length} />
    </Layout>
  );
}
