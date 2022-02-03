/*
 * WbPlanView logic for when the application is in the Mapping State
 * (when base table is selected and headers are loaded)
 *
 * @module
 */

import React from 'react';
import type { State } from 'typesafe-reducer';

import * as cache from '../cache';
import commonText from '../localization/common';
import wbText from '../localization/workbench';
import { getModel } from '../schema';
import type { IR, RA } from '../types';
import { defined } from '../types';
import type { ColumnOptions } from '../uploadplantomappingstree';
import { columnOptionsAreDefault } from '../wbplanviewlinesgetter';
import { reducer } from '../wbplanviewmappingreducer';
import { findRequiredMissingFields } from '../wbplanviewmodelhelper';
import { getMappingLineData } from '../wbplanviewnavigator';
import {
  getAutoMapperSuggestions,
  getMappedFields,
  getMappingsTree,
  getMustMatchTables,
  goBack,
  mappingPathIsComplete,
} from '../wbplanviewutils';
import { Button, Ul } from './basic';
import { useId } from './hooks';
import { icons } from './icons';
import { LoadingScreen } from './modaldialog';
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
export type FullMappingPath = Readonly<
  [...MappingPath, MappingType, string, ColumnOptions]
>;
/*
 * MappingType remains here from the time when we had `NewHeader` and
 *  `NewStaticHeader`. Also, it is not removed as it might be useful in the
 *  future if we would want to add new mapping types
 *
 */
export type MappingType = 'existingHeader';
export type RelationshipType =
  | 'one-to-one'
  | 'one-to-many'
  | 'many-to-one'
  | 'many-to-many';

export type SelectElementPosition = {
  readonly line: number;
  readonly index: number;
};

export type MappingLine = {
  readonly mappingType: MappingType;
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
  showHiddenFields: cache.get('wbPlanViewUi', 'showHiddenFields', {
    defaultValue: false,
  }),
  showMappingView: cache.get('wbPlanViewUi', 'showMappingView', {
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
  readonly readonly: boolean;
  readonly dataset: Dataset;
  readonly removeUnloadProtect: () => void;
  readonly setUnloadProtect: () => void;
  readonly baseTableName: string;
  readonly onChangeBaseTable: () => void;
  readonly onSave: (
    lines: RA<MappingLine>,
    mustMatchPreferences: IR<boolean>
  ) => Promise<void>;
  readonly onReRunAutoMapper: () => void;
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

  // Set/unset unload protect
  React.useEffect(() => {
    if (state.changesMade) props.setUnloadProtect();
    else props.removeUnloadProtect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.changesMade]);

  const getMappedFieldsBind = getMappedFields.bind(undefined, state.lines);
  const listOfMappings = React.useRef<HTMLUListElement>(null);

  // Reposition suggestions box if it doesn't fit
  function repositionSuggestionBox(): void {
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

    getAutoMapperSuggestions({
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
      getMappingsTree(state.lines, true),
      state.mustMatchPreferences
    );

  function handleSave(ignoreValidation: boolean): void {
    const validationResults = ignoreValidation ? [] : validate();
    if (validationResults.length === 0) {
      setIsLoading(true);
      void props
        .onSave(state.lines, state.mustMatchPreferences)
        .then(() => setIsLoading(false));
    } else
      dispatch({
        type: 'ValidationAction',
        validationResults,
      });
  }

  const handleChange = (payload: {
    readonly line: 'mappingView' | number;
    readonly index: number;
    readonly close: boolean;
    readonly newValue: string;
    readonly isRelationship: boolean;
    readonly parentTableName: string;
    readonly currentTableName: string;
    readonly newTableName: string;
  }): void =>
    dispatch({
      type: 'ChangeSelectElementValueAction',
      ...payload,
    });

  const handleClose = (): void =>
    dispatch({
      type: 'CloseSelectElementAction',
    });

  const [isLoading, setIsLoading] = React.useState(false);

  return isLoading ? (
    <LoadingScreen />
  ) : (
    <Layout
      title={
        <>
          <span title={wbText('dataSetName')}>{props.dataset.name}</span>
          <span title={wbText('baseTable')}>
            {` (${defined(getModel(props.baseTableName)).getLocalizedName()})`}
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
        props.readonly ? undefined : (
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
              onClick={props.onReRunAutoMapper}
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
            readonly={props.readonly}
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
               * Since setting table as must match causes all of it's fields to
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
          {!props.readonly && (
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
            {props.readonly ? wbText('dataEditor') : commonText('cancel')}
          </Button.Simple>
          {!props.readonly && (
            <Button.Simple
              disabled={!state.changesMade}
              onClick={(): void => handleSave(false)}
            >
              {commonText('save')}
            </Button.Simple>
          )}
        </>
      }
      // Don't close picklists on outside click in development. Useful for debugging
      onClick={process.env.NODE_ENV === 'development' ? undefined : handleClose}
    >
      {!props.readonly && state.validationResults.length > 0 && (
        <ValidationResults
          baseTableName={props.baseTableName}
          validationResults={state.validationResults}
          onSave={(): void => handleSave(true)}
          onDismissValidation={(): void =>
            dispatch({
              type: 'ValidationAction',
              validationResults: [],
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
          baseTableName={props.baseTableName}
          focusedLineExists={state.lines.length > 0}
          mappingPath={state.mappingView}
          hideToMany={false}
          showHiddenFields={state.showHiddenFields}
          mapButtonIsEnabled={
            typeof state.focusedLine === 'number' &&
            mappingPathIsComplete(state.mappingView)
          }
          readonly={props.readonly}
          mustMatchPreferences={state.mustMatchPreferences}
          handleMapButtonClick={
            props.readonly
              ? undefined
              : (): void => dispatch({ type: 'MappingViewMapAction' })
          }
          handleMappingViewChange={
            props.readonly
              ? undefined
              : (payload): void =>
                  handleChange({ line: 'mappingView', ...payload })
          }
          getMappedFields={getMappedFieldsBind}
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
            handleChange: props.readonly
              ? undefined
              : (payload): void => handleChange({ line, ...payload }),
            handleOpen,
            handleClose,
            handleAutoMapperSuggestionSelection: props.readonly
              ? undefined
              : (suggestion: string): void =>
                  dispatch({
                    type: 'AutoMapperSuggestionSelectedAction',
                    suggestion,
                  }),
            openSelectElement,
            autoMapperSuggestions:
              (!props.readonly && state.autoMapperSuggestions) || [],
            mappingLineData: getMappingLineData({
              baseTableName: props.baseTableName,
              mappingPath,
              iterate: true,
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
                  customSelectType: 'MAPPING_OPTIONS_LIST',
                  customSelectSubtype: 'simple',
                  fieldsData: mappingOptionsMenu({
                    id: (suffix) => id(`column-options-${line}-${suffix}`),
                    readonly: props.readonly,
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
                        type: 'ChangeDefaultValue',
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
                    tableName: '',
                    isRelationship: !columnOptionsAreDefault(columnOptions),
                  },
                  selectLabel: wbText('mappingOptions'),
                  ...(openSelectElement === lineData.length
                    ? {
                        isOpen: true,
                        handleChange: undefined,
                        handleClose: handleClose?.bind(
                          undefined,
                          lineData.length
                        ),
                      }
                    : {
                        isOpen: false,
                        handleOpen: handleOpen?.bind(
                          undefined,
                          lineData.length
                        ),
                      }),
                } as const,
              ]
            : lineData;

          return (
            <MappingLineComponent
              key={line}
              headerName={headerName}
              readonly={props.readonly}
              isFocused={line === state.focusedLine}
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
          props.readonly
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
