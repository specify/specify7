/*
 *
 * Contains WbPlanView logic for when the application is in the Mapping State
 * (when base table is selected and headers are loaded)
 *
 *
 */

import React from 'react';

import wbText from '../localization/workbench';
import type {
  ColumnOptions,
  MatchBehaviors,
} from '../uploadplantomappingstree';
import { getMappingLineData } from '../wbplanviewnavigator';
import type { AutoScrollTypes, RefMappingState } from '../wbplanviewrefreducer';
import { getMappedFields, mappingPathIsComplete } from '../wbplanviewutils';
import { useId } from './common';
import type { IR, RA } from '../types';
import type { MappingPathProps } from './wbplanviewcomponents';
import { MappingLineComponent } from './wbplanviewcomponents';
import {
  MappingsControlPanel,
  MappingView,
  minMappingViewHeight,
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
export type MappingPath = RA<string>;
export type MappingPathWritable = string[];
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

export type AutoMapperSuggestion = MappingPathProps & {
  readonly mappingPath: MappingPath;
};

export type WbPlanViewMapperBaseProps = {
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
  readonly lines: RA<MappingLine>;
  readonly openSelectElement?: SelectElementPosition;
  readonly focusedLine: number;
  readonly autoMapperSuggestions?: RA<AutoMapperSuggestion>;
  readonly mustMatchPreferences: IR<boolean>;
};

export default function WbPlanViewMapper(
  props: WbPlanViewMapperBaseProps & {
    readonly refObject: React.MutableRefObject<Partial<RefMappingState>>;
    readonly handleSave: () => void;
    readonly handleFocus: (lineIndex: number) => void;
    readonly handleMappingViewMap: () => void;
    readonly handleAddNewHeader: () => void;
    readonly handleToggleHiddenFields: () => void;
    readonly readonly: boolean;
    readonly handleOpen: (line: number, index: number) => void;
    readonly handleClose: () => void;
    readonly handleChange: (payload: {
      readonly line: 'mappingView' | number;
      readonly index: number;
      readonly close: boolean;
      readonly newValue: string;
      readonly isRelationship: boolean;
      readonly currentTableName: string;
      readonly newTableName: string;
      readonly isDoubleClick: boolean;
    }) => void;
    readonly handleClearMapping: (index: number) => void;
    readonly handleAutoMapperSuggestionSelection: (suggestion: string) => void;
    readonly handleValidationResultClick: (mappingPath: MappingPath) => void;
    readonly handleDismissValidation: () => void;
    readonly handleMappingViewResize: (height: number) => void;
    readonly handleAutoScrollStatusChange: (
      autoScrollType: AutoScrollTypes,
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
  const listOfMappings = React.useRef<HTMLUListElement>(null);

  const mappingViewParentRef = React.useRef<HTMLDivElement | null>(null);

  // Scroll listOfMappings to the bottom when new header is added
  React.useEffect(() => {
    if (
      typeof props.refObject.current.autoScroll === 'undefined' ||
      !listOfMappings.current ||
      !mappingViewParentRef.current
    )
      return;

    (
      Object.entries(props.refObject.current.autoScroll) as [
        AutoScrollTypes,
        boolean
      ][]
    )
      .filter(([, autoScroll]) => autoScroll)
      .forEach(([autoScrollType]) => {
        if (autoScrollType === 'listOfMappings') {
          if (!listOfMappings.current) return;

          listOfMappings.current.scrollTop =
            listOfMappings.current.scrollHeight;
        }

        props.handleAutoScrollStatusChange(autoScrollType, false);
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

    return (): void => resizeObserver.disconnect();
  }, [mappingViewParentRef.current]);

  // Reposition suggestions box if it doesn't fit
  function repositionSuggestionBox(): void {
    if (
      typeof props.autoMapperSuggestions === 'undefined' ||
      props.autoMapperSuggestions.length === 0
    )
      return;

    if (listOfMappings.current === null) return;

    const autoMapperSuggestions = listOfMappings.current.getElementsByClassName(
      'custom-select-suggestion-list'
    )[0] as HTMLElement | undefined;

    if (!autoMapperSuggestions) return;

    const customSelectElement = autoMapperSuggestions.parentElement;

    if (!customSelectElement) return;

    const autoMapperSuggestionsHeight = autoMapperSuggestions.clientHeight;

    const listOfMappingsPosition = listOfMappings.current.offsetTop;
    const currentScrollTop = listOfMappings.current.scrollTop;
    const picklistPosition = customSelectElement.offsetTop;

    // Suggestions list fits on the screen. nothing to do
    if (
      picklistPosition - listOfMappingsPosition - autoMapperSuggestionsHeight >=
      0
    )
      return;

    if (!autoMapperSuggestions.classList.contains('controlled'))
      autoMapperSuggestions.classList.add('controlled');

    const suggestionsListPosition =
      picklistPosition - autoMapperSuggestionsHeight - currentScrollTop;

    const scrollPosition =
      picklistPosition - currentScrollTop - listOfMappingsPosition;

    // Hide suggestions box once its parent picklist becomes hidden
    autoMapperSuggestions.style.visibility =
      scrollPosition > 0 ? 'visible' : 'hidden';

    if (scrollPosition > 0)
      autoMapperSuggestions.style.top = `${suggestionsListPosition}px`;
  }

  React.useEffect(repositionSuggestionBox, [
    props.autoMapperSuggestions,
    listOfMappings,
  ]);

  React.useEffect(() => {
    window.addEventListener('resize', repositionSuggestionBox);
    return (): void =>
      window.removeEventListener('resize', repositionSuggestionBox);
  }, []);

  const id = useId('wbplanviewmapper');

  return (
    <>
      {!props.readonly && props.validationResults.length > 0 && (
        <ValidationResults
          baseTableName={props.baseTableName}
          validationResults={props.validationResults}
          onSave={props.handleSave}
          onDismissValidation={props.handleDismissValidation}
          getMappedFields={getMappedFieldsBind}
          onValidationResultClick={props.handleValidationResultClick}
          mustMatchPreferences={props.mustMatchPreferences}
        />
      )}
      {props.showMappingView && (
        <section
          className="mapping-view-parent"
          style={
            {
              '--mapping-view-min-height': `${minMappingViewHeight}px`,
              '--mapping-view-height': `${
                props.refObject.current.mappingViewHeight ?? ''
              }px`,
            } as React.CSSProperties
          }
          aria-label={wbText('mappingEditor')}
          ref={mappingViewParentRef}
        >
          <div className="mapping-view-container">
            <MappingView
              baseTableName={props.baseTableName}
              focusedLineExists={props.lines.length > 0}
              mappingPath={props.mappingView}
              showHiddenFields={props.showHiddenFields}
              mapButtonIsEnabled={
                typeof props.focusedLine !== 'undefined' &&
                mappingPathIsComplete(props.mappingView)
              }
              readonly={props.readonly}
              mustMatchPreferences={props.mustMatchPreferences}
              handleMapButtonClick={
                props.readonly ? undefined : props.handleMappingViewMap
              }
              handleMappingViewChange={
                props.readonly
                  ? undefined
                  : (payload): void =>
                      props.handleChange({ line: 'mappingView', ...payload })
              }
              getMappedFields={getMappedFieldsBind}
            />
          </div>
          <span
            className="mapping-view-resizer"
            title={wbText('resizeMappingEditorButtonDescription')}
            aria-hidden={true}
          >
            ⇲
          </span>
        </section>
      )}

      <ul
        className="mapping-line-list"
        tabIndex={-1}
        ref={listOfMappings}
        onScroll={repositionSuggestionBox}
        aria-label={wbText('mappings')}
        aria-orientation="vertical"
      >
        {props.lines.map(
          ({ mappingPath, headerName, mappingType, columnOptions }, index) => {
            const lineData = getMappingLineData({
              baseTableName: props.baseTableName,
              mappingPath,
              generateLastRelationshipData: true,
              iterate: true,
              customSelectType: 'CLOSED_LIST',
              handleChange: props.readonly
                ? undefined
                : (payload): void =>
                    props.handleChange({ line: index, ...payload }),
              handleOpen: props.handleOpen.bind(undefined, index),
              handleClose: props.handleClose,
              handleAutoMapperSuggestionSelection:
                (!props.readonly &&
                  props.handleAutoMapperSuggestionSelection) ||
                undefined,
              getMappedFields: getMappedFieldsBind,
              openSelectElement:
                props.openSelectElement?.line === index
                  ? props.openSelectElement
                  : undefined,
              showHiddenFields: props.showHiddenFields,
              autoMapperSuggestions:
                (!props.readonly && props.autoMapperSuggestions) || [],
              mustMatchPreferences: props.mustMatchPreferences,
              columnOptions,
              mappingOptionsMenuGenerator: () => ({
                matchBehavior: {
                  optionLabel: (
                    <>
                      {wbText('matchBehavior')}
                      <ul style={{ padding: 0, margin: 0 }}>
                        {Object.entries({
                          ignoreWhenBlank: {
                            title: wbText('ignoreWhenBlank'),
                            description: wbText('ignoreWhenBlankDescription'),
                          },
                          ignoreAlways: {
                            title: wbText('ignoreAlways'),
                            description: wbText('ignoreAlwaysDescription'),
                          },
                          ignoreNever: {
                            title: wbText('ignoreNever'),
                            description: wbText('ignoreNeverDescription'),
                          },
                        }).map(([id, { title, description }]) => (
                          <li key={id}>
                            <label title={description}>
                              <input
                                type="radio"
                                name="match-behavior"
                                value={id}
                                checked={columnOptions.matchBehavior === id}
                                readOnly={props.readonly}
                                onChange={({ target }): void =>
                                  props.handleChangeMatchBehaviorAction(
                                    index,
                                    target.value as MatchBehaviors
                                  )
                                }
                              />
                              {` ${title}`}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </>
                  ),
                },
                nullAllowed: {
                  optionLabel: (
                    <label>
                      <input
                        type="checkbox"
                        checked={columnOptions.nullAllowed}
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
                      {wbText('allowNullValues')}
                    </label>
                  ),
                },
                default: {
                  optionLabel: (
                    <>
                      <label>
                        <input
                          type="checkbox"
                          checked={columnOptions.default !== null}
                          disabled={props.readonly}
                          onChange={
                            (!props.readonly &&
                              ((): void =>
                                props.handleChangeDefaultValue(
                                  index,
                                  columnOptions.default === null ? '' : null
                                ))) ||
                            undefined
                          }
                        />{' '}
                        <span id={id(`default-value-${index}`)}>
                          {wbText('useDefaultValue')}
                        </span>
                        {columnOptions.default !== null && ':'}
                      </label>
                      {typeof columnOptions.default === 'string' && (
                        <>
                          <br />
                          <textarea
                            value={columnOptions.default || ''}
                            title={wbText('defaultValue')}
                            aria-labelledby={id(`default-value-${index}`)}
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
                  title: wbText('useDefaultValueDescription'),
                },
              }),
            });
            return (
              <MappingLineComponent
                key={index}
                headerName={headerName}
                mappingType={mappingType}
                readonly={props.readonly}
                isFocused={index === props.focusedLine}
                onFocus={props.handleFocus.bind(undefined, index)}
                onKeyDown={(event): void => {
                  const openSelectElement =
                    props.openSelectElement?.line === index
                      ? props.openSelectElement.index
                      : undefined;

                  if (typeof openSelectElement === 'number') {
                    if (event.key === 'ArrowLeft')
                      if (openSelectElement > 0)
                        props.handleOpen(index, openSelectElement - 1);
                      else props.handleClose();
                    else if (event.key === 'ArrowRight')
                      if (openSelectElement + 1 < lineData.length)
                        props.handleOpen(index, openSelectElement + 1);
                      else props.handleClose();

                    return;
                  }

                  if (event.key === 'ArrowLeft')
                    props.handleOpen(index, lineData.length - 1);
                  else if (event.key === 'ArrowRight' || event.key === 'Enter')
                    props.handleOpen(index, 0);
                  else if (event.key === 'ArrowUp' && index > 0)
                    props.handleFocus(index - 1);
                  else if (
                    event.key === 'ArrowDown' &&
                    index + 1 < props.lines.length
                  )
                    props.handleFocus(index + 1);
                }}
                onClearMapping={props.handleClearMapping.bind(undefined, index)}
                lineData={lineData}
              />
            );
          }
        )}
      </ul>

      <MappingsControlPanel
        showHiddenFields={props.showHiddenFields}
        onToggleHiddenFields={props.handleToggleHiddenFields}
        onAddNewHeader={
          props.readonly
            ? undefined
            : (): void => {
                props.handleAddNewHeader();
                props.handleAutoScrollStatusChange('listOfMappings', true);
              }
        }
        readonly={props.readonly}
      />
    </>
  );
}
