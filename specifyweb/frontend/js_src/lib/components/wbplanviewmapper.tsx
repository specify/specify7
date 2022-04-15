/*
 * WbPlanView logic for when the application is in the Mapping State
 * (when base table is selected and headers are loaded)
 *
 * @module
 */

import React from 'react';
import type { State } from 'typesafe-reducer';

import type { Tables } from '../datamodel';
import commonText from '../localization/common';
import wbText from '../localization/workbench';
import { getModel } from '../schema';
import type { IR, RA } from '../types';
import { defined } from '../types';
import type { ColumnOptions } from '../uploadplanparser';
import { columnOptionsAreDefault } from '../wbplanviewlinesgetter';
import { reducer } from '../wbplanviewmappingreducer';
import { findRequiredMissingFields } from '../wbplanviewmodelhelper';
import { getMappingLineData } from '../wbplanviewnavigator';
import {
  fetchAutoMapperSuggestions,
  getMappedFields,
  getMustMatchTables,
  goBack,
  mappingPathIsComplete,
} from '../wbplanviewutils';
import { Button, Ul } from './basic';
import { TableIcon } from './common';
import { LoadingContext } from './contexts';
import { useId, useUnloadProtect } from './hooks';
import { icons } from './icons';
import type { Dataset } from './wbplanview';
import type { MappingElementProps } from './wbplanviewcomponents';
import {
  getMappingLineProps,
  MappingLineComponent,
  ValidationButton,
} from './wbplanviewcomponents';
import { Layout } from './wbplanviewheader';
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
} from './wbplanviewmappercomponents';
import { getCache } from '../cache';

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
    showMappingView: boolean;
    showHiddenFields: boolean;
    mappingView: MappingPath;
    mappingsAreValidated: boolean;
    lines: RA<MappingLine>;
    focusedLine: number;
    changesMade: boolean;
    mustMatchPreferences: IR<boolean>;
    autoMapperSuggestions?: RA<AutoMapperSuggestion>;
    openSelectElement?: SelectElementPosition;
    validationResults: RA<MappingPath>;
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
  showHiddenFields: getCache('wbPlanViewUi', 'showHiddenFields', {
    defaultValue: false,
  }),
  showMappingView: getCache('wbPlanViewUi', 'showMappingView', {
    defaultValue: true,
  }),
  mappingView: ['0'],
  mappingsAreValidated: false,
  validationResults: [],
  lines,
  focusedLine: 0,
  changesMade,
  mustMatchPreferences,
});

export function WbPlanViewMapper(props: {
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

  const unsetUnloadProtect = useUnloadProtect(
    state.changesMade,
    wbText('unloadProtectMessage')
  );

  // Set/unset unload protect

  const getMappedFieldsBind = getMappedFields.bind(undefined, state.lines);
  const listOfMappings = React.useRef<HTMLUListElement>(null);

  // Reposition suggestions box if it doesn't fit
  function repositionSuggestionBox(): void {
    /*
     * TODO: replace this with this hack:
     *   https://stackoverflow.com/questions/9364203/position-fixed-div-is-not-fixed-when-parent-rotates-or-translates
     *   alternatively, I may get away with not setting "top" at all and just
     *   letting browser do the positioning (while still having position:fixed)
     */
    if (
      typeof state.autoMapperSuggestions === 'undefined' ||
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

  React.useEffect(() => {
    window.addEventListener('resize', repositionSuggestionBox);
    return (): void =>
      window.removeEventListener('resize', repositionSuggestionBox);
  }, []);

  // Fetch automapper suggestions when opening a custom select element
  React.useEffect(() => {
    if (
      typeof state.openSelectElement === 'undefined' ||
      typeof state.lines[state.openSelectElement.line].mappingPath[
        state.openSelectElement.index
      ] === 'undefined'
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
      .catch(console.error);

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
    typeof state.focusedLine === 'number' &&
    mappingPathIsComplete(state.mappingView);

  return (
    <Layout
      title={
        <>
          <TableIcon name={props.baseTableName} />
          <span title={wbText('dataSetName')}>{props.dataset.name}</span>
          <span title={wbText('baseTable')}>
            {` (${defined(getModel(props.baseTableName)).label})`}
          </span>
          <span
            className="flex items-center text-red-600"
            title={wbText('dataSetUploadedDescription')}
          >
            {` ${wbText('dataSetUploaded')}`}
          </span>
        </>
      }
      buttonsLeft={
        props.isReadOnly ? undefined : (
          <>
            <ChangeBaseTable onClick={props.onChangeBaseTable} />
            <Button.Simple
              aria-haspopup="dialog"
              onClick={(): void =>
                dispatch({
                  type: 'ResetMappingsAction',
                })
              }
            >
              {wbText('clearMappings')}
            </Button.Simple>
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
            isReadOnly={props.isReadOnly}
            getMustMatchPreferences={(): IR<boolean> =>
              getMustMatchTables({
                baseTableName: props.baseTableName,
                lines: state.lines,
                mustMatchPreferences: state.mustMatchPreferences,
              })
            }
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
            <ValidationButton
              canValidate={state.lines.some(({ mappingPath }) =>
                mappingPathIsComplete(mappingPath)
              )}
              isValidated={state.mappingsAreValidated}
              onClick={(): void =>
                dispatch({
                  type: 'ValidationAction',
                  validationResults: validate(),
                })
              }
            />
          )}
          <Button.Simple
            aria-haspopup="dialog"
            onClick={(): void => goBack(props.dataset.id)}
          >
            {props.isReadOnly ? wbText('dataEditor') : commonText('cancel')}
          </Button.Simple>
          {!props.isReadOnly && (
            <Button.Simple
              disabled={!state.changesMade}
              onClick={(): void => handleSave(false)}
            >
              {commonText('save')}
            </Button.Simple>
          )}
        </>
      }
      onClick={handleClose}
    >
      {!props.isReadOnly && state.validationResults.length > 0 && (
        <ValidationResults
          baseTableName={props.baseTableName}
          validationResults={state.validationResults}
          onSave={(): void => handleSave(true)}
          onDismissValidation={(): void =>
            dispatch({
              type: 'ClearValidationAction',
            })
          }
          getMappedFields={getMappedFieldsBind}
          onValidationResultClick={(mappingPath: MappingPath): void =>
            dispatch({
              type: 'ValidationResultClickAction',
              mappingPath,
            })
          }
          mustMatchPreferences={state.mustMatchPreferences}
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
          mapButton={
            <Button.Simple
              className="flex-col justify-center p-2"
              disabled={!mapButtonEnabled}
              onClick={(): void => dispatch({ type: 'MappingViewMapAction' })}
              aria-label={wbText('map')}
              title={wbText('mapButtonDescription')}
            >
              {wbText('map')}
              <span
                className={`text-green-500 ${
                  mapButtonEnabled ? '' : 'invisible'
                }`}
                aria-hidden="true"
              >
                &#8594;
              </span>
            </Button.Simple>
          }
        />
      )}

      <Ul
        className={`auto-rows-max flex-1 overflow-x-hidden grid
          grid-cols-[theme(spacing.8)_max-content_auto]
          print:grid-cols-[min-content_auto]`}
        tabIndex={-1}
        forwardRef={listOfMappings}
        onScroll={repositionSuggestionBox}
        aria-label={wbText('mappings')}
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
                      <span
                        aria-label={wbText('mappingOptions')}
                        title={wbText('mappingOptions')}
                      >
                        {icons.cog}
                      </span>
                    ),
                    tableName: undefined,
                    isRelationship: !columnOptionsAreDefault(columnOptions),
                  },
                  selectLabel: wbText('mappingOptions'),
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
            <MappingLineComponent
              key={line}
              headerName={headerName}
              isReadOnly={props.isReadOnly}
              isFocused={line === state.focusedLine}
              onFocus={(): void =>
                dispatch({
                  type: 'FocusLineAction',
                  line,
                })
              }
              // Same key bindings as in QueryBuilder
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
                else if (key === 'ArrowRight' || key === 'Enter') handleOpen(0);
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
              onClearMapping={(): void =>
                dispatch({
                  type: 'ClearMappingLineAction',
                  line,
                })
              }
              lineData={fullLineData}
            />
          );
        })}
      </Ul>

      <MappingsControlPanel
        showHiddenFields={state.showHiddenFields}
        onToggleHiddenFields={(): void =>
          dispatch({ type: 'ToggleHiddenFieldsAction' })
        }
        onAddNewHeader={
          props.isReadOnly
            ? undefined
            : (newHeaderName): void => {
                dispatch({ type: 'AddNewHeaderAction', newHeaderName });
                // Scroll listOfMappings to the bottom
                if (listOfMappings.current)
                  listOfMappings.current.scrollTop =
                    listOfMappings.current.scrollHeight;
              }
        }
      />
      <EmptyDataSetDialog lineCount={state.lines.length} />
    </Layout>
  );
}
