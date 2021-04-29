/*
 *
 * Contains WbPlanView logic for when the application is in the Mapping State
 * (when base table is selected and headers are loaded)
 *
 *
 */

'use strict';

import React from 'react';
import type {
  ColumnOptions,
  MatchBehaviors,
} from '../uploadplantomappingstree';
import { getMappingLineData } from '../wbplanviewnavigator';
import type { MappingActions } from '../wbplanviewreducer';
import type { AutoScrollTypes, RefMappingState } from '../wbplanviewrefreducer';
import { getMappedFields, mappingPathIsComplete } from '../wbplanviewutils';
import type { MappingPathProps } from './wbplanviewcomponents';
import { MappingElement, MappingLineComponent } from './wbplanviewcomponents';
import {
  FormatValidationResults,
  MappingsControlPanel,
  MappingView,
  minMappingViewHeight,
} from './wbplanviewmappercomponents';

/*
 * Scope is used to differentiate between mapper definitions that should
 * be used by the automapper and suggestion boxes
 */
export type AutomapperScope =
  // Used when selecting a base table
  | 'automapper'
  // Suggestion boxes - used when opening a picklist
  | 'suggestion';
export type MappingPath = string[];
export type FullMappingPath = [...string[], MappingType, string, ColumnOptions];
export type ListOfHeaders = string[];
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

export interface SelectElementPosition {
  readonly line: number;
  readonly index: number;
}

export interface MappingLine {
  readonly type: MappingType;
  readonly name: string;
  readonly mappingPath: MappingPath;
  readonly options: ColumnOptions;
  readonly isFocused?: boolean;
}

export interface AutomapperSuggestion extends MappingPathProps {
  mappingPath: MappingPath;
}

export interface WBPlanViewMapperBaseProps {
  readonly mappingIsTemplated: boolean;
  readonly showHiddenFields: boolean;
  readonly showMappingView: boolean;
  readonly baseTableName: string;
  /*
   * The index that would be shown in the header name the next time the user
   * presses `New Column`
   */
  readonly newHeaderId: number;
  readonly mappingView: MappingPath;
  readonly validationResults: MappingPath[];
  readonly lines: MappingLine[];
  readonly openSelectElement?: SelectElementPosition;
  readonly focusedLine?: number;
  readonly automapperSuggestions?: AutomapperSuggestion[];
}

export default function WBPlanViewMapper(
  props: WBPlanViewMapperBaseProps & {
    readonly mapperDispatch: (action: MappingActions) => void;
    readonly refObject: React.MutableRefObject<Partial<RefMappingState>>;
    readonly handleSave: () => void;
    readonly handleFocus: (lineIndex: number) => void;
    readonly handleMappingViewMap: () => void;
    readonly handleAddNewHeader: () => void;
    readonly handleToggleHiddenFields: () => void;
    readonly readonly: boolean;
    readonly handleOpen: (line: number, index: number) => void;
    readonly handleClose: () => void;
    readonly handleChange: (
      line: 'mappingView' | number,
      index: number,
      newValue: string,
      isRelationship: boolean,
      currentTable: string,
      newTable: string
    ) => void;
    readonly handleClearMapping: (index: number) => void;
    readonly handleAutomapperSuggestionSelection: (suggestion: string) => void;
    readonly handleValidationResultClick: (mappingPath: MappingPath) => void;
    readonly handleToggleMappingIsTemplated: () => void;
    readonly handleMappingViewResize: (height: number) => void;
    readonly handleAutoscrollStatusChange: (
      autoscrollType: AutoScrollTypes,
      status: boolean
    ) => void;
    readonly handleChangeMatchBehaviorAction: (
      line: number,
      matchBehavior: MatchBehaviors
    ) => void;
    readonly handleToggleAllowNullsAction: (
      line: number,
      allowNull: boolean
    ) => void;
    readonly handleChangeDefaultValue: (
      line: number,
      defaultValue: string | null
    ) => void;
  }
): JSX.Element {
  const getMappedFieldsBind = getMappedFields.bind(undefined, props.lines);
  const listOfMappings = React.useRef<HTMLDivElement>(null);

  const mappingViewParentRef = React.useRef<HTMLDivElement | null>(null);

  // Scroll listOfMappings/mappingView/open picklist to correct position
  React.useEffect(() => {
    if (
      typeof props.refObject.current.autoscroll === 'undefined' ||
      !listOfMappings.current ||
      !mappingViewParentRef.current
    )
      return;

    (Object.entries(props.refObject.current.autoscroll) as [
      AutoScrollTypes,
      boolean
    ][])
      .filter(([, autoscroll]) => autoscroll)
      .forEach(([autoscrollType]) => {
        if (autoscrollType === 'listOfMappings') {
          if (!listOfMappings.current) return;

          listOfMappings.current.scrollTop =
            listOfMappings.current.scrollHeight;
        }

        if (autoscrollType === 'mappingView') {
          if (!mappingViewParentRef.current) return;

          if (props.validationResults.length > 0)
            mappingViewParentRef.current.scrollLeft = 0;
        }

        props.handleAutoscrollStatusChange(autoscrollType, false);
      });
  });

  // `resize` event listener for the mapping view
  React.useEffect(() => {
    if (
      typeof ResizeObserver === 'undefined' ||
      mappingViewParentRef === null ||
      !mappingViewParentRef.current
    )
      return undefined;

    const resizeObserver = new ResizeObserver(
      () =>
        mappingViewParentRef.current &&
        props.handleMappingViewResize(mappingViewParentRef.current.offsetHeight)
    );

    resizeObserver.observe(mappingViewParentRef.current);

    return () => resizeObserver.disconnect();
  }, [mappingViewParentRef.current]);

  // Reposition suggestions box if it doesn't fit
  function repositionSuggestionBox(): void {
    if (
      typeof props.automapperSuggestions === 'undefined' ||
      props.automapperSuggestions.length === 0
    )
      return;

    if (listOfMappings.current === null) return;

    const automapperSuggestions = listOfMappings.current.getElementsByClassName(
      'custom-select-suggestion-list'
    )[0] as HTMLElement | undefined;

    if (!automapperSuggestions) return;

    const customSelectElement = automapperSuggestions.parentElement;

    if (!customSelectElement) return;

    const automapperSuggestionsHeight = automapperSuggestions.clientHeight;

    const listOfMappingsPosition = listOfMappings.current.offsetTop;
    const currentScrollTop = listOfMappings.current.scrollTop;
    const picklistPosition = customSelectElement.offsetTop;

    // Suggestions list fits on the screen. nothing to do
    if (
      picklistPosition - listOfMappingsPosition - automapperSuggestionsHeight >=
      0
    )
      return;

    if (!automapperSuggestions.classList.contains('controlled'))
      automapperSuggestions.classList.add('controlled');

    const suggestionsListPosition =
      picklistPosition - automapperSuggestionsHeight - currentScrollTop;

    const scrollPosition =
      picklistPosition - currentScrollTop - listOfMappingsPosition;

    // Hide suggestions box once its parent picklist becomes hidden
    automapperSuggestions.style.visibility =
      scrollPosition > 0 ? 'visible' : 'hidden';

    if (scrollPosition > 0)
      automapperSuggestions.style.top = `${suggestionsListPosition}px`;
  }

  React.useEffect(repositionSuggestionBox, [
    props.automapperSuggestions,
    listOfMappings,
  ]);

  React.useEffect(() => {
    window.addEventListener('resize', repositionSuggestionBox);
    return () => window.removeEventListener('resize', repositionSuggestionBox);
  }, []);

  return (
    <>
      {props.showMappingView && (
        <div
          className="mapping-view-parent"
          style={
            {
              '--min-height': `${minMappingViewHeight}px`,
              '--original-height': `${
                props.refObject.current.mappingViewHeight ?? ''
              }px`,
            } as React.CSSProperties
          }
          ref={mappingViewParentRef}
        >
          <div className="mapping-view-container">
            {!props.readonly && (
              <FormatValidationResults
                baseTableName={props.baseTableName}
                validationResults={props.validationResults}
                handleSave={props.handleSave}
                getMappedFields={getMappedFieldsBind}
                onValidationResultClick={props.handleValidationResultClick}
              />
            )}
            <MappingView
              baseTableName={props.baseTableName}
              focusedLineExists={typeof props.focusedLine !== 'undefined'}
              mappingPath={props.mappingView}
              showHiddenFields={props.showHiddenFields}
              mapButtonIsEnabled={
                typeof props.focusedLine !== 'undefined' &&
                mappingPathIsComplete(props.mappingView)
              }
              readonly={props.readonly}
              handleMapButtonClick={
                (!props.readonly && props.handleMappingViewMap) || undefined
              }
              handleMappingViewChange={
                (!props.readonly &&
                  props.handleChange.bind(undefined, 'mappingView')) ||
                undefined
              }
              getMappedFields={getMappedFieldsBind}
            />
          </div>
        </div>
      )}

      <div
        className="mapping-line-list"
        ref={listOfMappings}
        onScroll={repositionSuggestionBox}
      >
        {props.lines.map(({ mappingPath, name, type, options }, index) => (
          <MappingLineComponent
            key={index}
            headerName={name}
            mappingType={type}
            readonly={props.readonly}
            isFocused={index === props.focusedLine}
            handleFocus={props.handleFocus.bind(undefined, index)}
            handleClearMapping={props.handleClearMapping.bind(undefined, index)}
            lineData={getMappingLineData({
              baseTableName: props.baseTableName,
              mappingPath,
              generateLastRelationshipData: true,
              customSelectType: 'CLOSED_LIST',
              handleChange:
                (!props.readonly &&
                  props.handleChange.bind(undefined, index)) ||
                undefined,
              handleOpen: props.handleOpen.bind(undefined, index),
              handleClose: props.handleClose.bind(undefined, index),
              handleAutomapperSuggestionSelection:
                (!props.readonly &&
                  props.handleAutomapperSuggestionSelection) ||
                undefined,
              getMappedFields: getMappedFieldsBind,
              openSelectElement:
                typeof props.openSelectElement !== 'undefined' &&
                props.openSelectElement.line === index
                  ? props.openSelectElement
                  : undefined,
              showHiddenFields: props.showHiddenFields,
              automapperSuggestions:
                (!props.readonly && props.automapperSuggestions) || [],
              mappingOptionsMenuGenerator: () => ({
                matchBehavior: {
                  fieldFriendlyName: (
                    <label>
                      Match behavior:
                      <MappingElement
                        isOpen={true}
                        customSelectType="MAPPING_OPTION_LINE_LIST"
                        handleChange={
                          (!props.readonly &&
                            ((matchBehavior): void =>
                              props.handleChangeMatchBehaviorAction(
                                index,
                                matchBehavior as MatchBehaviors
                              ))) ||
                          undefined
                        }
                        fieldsData={{
                          ignoreWhenBlank: {
                            fieldFriendlyName: 'Ignore when Blank',
                            title:
                              'When set to "Ignore when Blank" blank ' +
                              'values in this column will not be ' +
                              'considered for matching purposes. Blank ' +
                              'values are ignored when matching even if a ' +
                              'default value is provided',
                            isEnabled: true,
                            isRequired: false,
                            isHidden: false,
                            isDefault:
                              options.matchBehavior === 'ignoreWhenBlank',
                          },
                          ignoreAlways: {
                            fieldFriendlyName: 'Always ignore',
                            title:
                              'When set to ignoreAlways the value in ' +
                              'this column will never be considered for ' +
                              'matching purposes, only for uploading.',
                            isEnabled: true,
                            isRequired: false,
                            isHidden: false,
                            isDefault: options.matchBehavior === 'ignoreAlways',
                          },
                          ignoreNever: {
                            fieldFriendlyName: 'Never ignore',
                            title:
                              'This column would always be considered ' +
                              "for matching purposes, regardless of it's " +
                              'value',
                            isEnabled: true,
                            isRequired: false,
                            isHidden: false,
                            isDefault: options.matchBehavior === 'ignoreNever',
                          },
                        }}
                      />
                    </label>
                  ),
                },
                nullAllowed: {
                  fieldFriendlyName: (
                    <label>
                      <input
                        type="checkbox"
                        checked={options.nullAllowed}
                        disabled={props.readonly}
                        onChange={
                          (!props.readonly &&
                            ((event): void =>
                              props.handleToggleAllowNullsAction(
                                index,
                                event.target.checked
                              ))) ||
                          undefined
                        }
                      />{' '}
                      Allow Null values
                    </label>
                  ),
                },
                default: {
                  fieldFriendlyName: (
                    <>
                      <label>
                        <input
                          type="checkbox"
                          checked={options.default !== null}
                          disabled={props.readonly}
                          onChange={
                            (!props.readonly &&
                              ((): void =>
                                props.handleChangeDefaultValue(
                                  index,
                                  options.default === null ? '' : null
                                ))) ||
                            undefined
                          }
                        />{' '}
                        Use default value{options.default !== null && ':'}
                      </label>
                      {typeof options.default === 'string' && (
                        <>
                          <br />
                          <textarea
                            value={options.default || ''}
                            onChange={
                              (!props.readonly &&
                                ((event): void =>
                                  props.handleChangeDefaultValue(
                                    index,
                                    event.target.value
                                  ))) ||
                              undefined
                            }
                            disabled={props.readonly}
                          />
                        </>
                      )}
                    </>
                  ),
                  title: 'This value would be used in place of empty cells',
                },
              }),
            })}
          />
        ))}
      </div>

      <MappingsControlPanel
        showHiddenFields={props.showHiddenFields}
        handleToggleHiddenFields={props.handleToggleHiddenFields}
        handleAddNewHeader={
          props.readonly
            ? undefined
            : (): void => {
                props.handleAddNewHeader();
                props.handleAutoscrollStatusChange('listOfMappings', true);
              }
        }
        /*
         *HandleToggleMappingIsTemplated={
         *(!props.readonly && props.handleToggleMappingIsTemplated) || undefined
         *}
         *mappingIsTemplated={props.mappingIsTemplated}
         */
      />
    </>
  );
}
