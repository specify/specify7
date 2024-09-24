import React from 'react';

import { useDistantRelated } from '../../hooks/resource';
import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { f } from '../../utils/functools';
import type { ValueOf } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { DataEntry } from '../Atoms/DataEntry';
import { ReadOnlyContext, SearchDialogContext } from '../Core/Contexts';
import { backboneFieldSeparator, toTable } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import { genericTables } from '../DataModel/tables';
import { softFail } from '../Errors/Crash';
import { fetchPathAsString } from '../Formatters/formatters';
import { UiCommand } from '../FormCommands';
import { FormField } from '../FormFields';
import type { FormType } from '../FormParse';
import { fetchView, resolveViewDefinition } from '../FormParse';
import type {
  cellAlign,
  CellTypes,
  cellVerticalAlign,
} from '../FormParse/cells';
import { SpecifyForm } from '../Forms/SpecifyForm';
import { SubView } from '../Forms/SubView';
import { propsToFormMode } from '../Forms/useViewDefinition';
import { TableIcon } from '../Molecules/TableIcon';
import { PickListTypes } from '../PickLists/definitions';
import { PickListEditor } from './PickListEditor';

const cellRenderers: {
  readonly [KEY in keyof CellTypes]: (props: {
    readonly cellData: CellTypes[KEY];
    readonly id: string | undefined;
    readonly formatId: (id: string) => string;
    readonly resource: SpecifyResource<AnySchema>;
    readonly formType: FormType;
    readonly align: typeof cellAlign[number];
    readonly verticalAlign: typeof cellVerticalAlign[number];
  }) => JSX.Element | null;
} = {
  Field({
    cellData: { fieldDefinition, fieldNames, isRequired },
    id,
    formatId,
    resource,
    formType,
  }) {
    const fields = React.useMemo(
      () =>
        resource.specifyTable.getFields(
          fieldNames?.join(backboneFieldSeparator) ?? ''
        ),
      [resource.specifyTable, fieldNames]
    );
    return (
      <FormField
        fieldDefinition={fieldDefinition}
        fields={fields}
        formType={formType}
        id={typeof id === 'string' ? formatId(id.toString()) : undefined}
        isRequired={isRequired}
        resource={resource}
      />
    );
  },
  Label({ cellData: { text, labelForCellId, title }, formatId, align }) {
    const style: React.CSSProperties = {
      textAlign:
        align === 'right' ? 'right' : align === 'center' ? 'center' : undefined,
    };
    return typeof text === 'string' &&
      text.length === 0 ? null : typeof labelForCellId === 'string' ? (
      <label htmlFor={formatId(labelForCellId)} style={style} title={title}>
        {text}
      </label>
    ) : (
      <p style={style} title={title}>
        {text}
      </p>
    );
  },
  Separator({ cellData: { label, icon, forClass } }) {
    return typeof label === 'string' || typeof forClass === 'string' ? (
      <DataEntry.SubFormTitle
        className="border-b border-gray-500"
        title={
          typeof forClass === 'string'
            ? genericTables[forClass].localization.desc ?? undefined
            : undefined
        }
      >
        {typeof forClass === 'string' ? (
          <>
            <TableIcon label={false} name={forClass} />
            {genericTables[forClass].label}
          </>
        ) : (
          <>
            {typeof icon === 'string' && (
              <TableIcon label={false} name={icon} />
            )}
            {label}
          </>
        )}
      </DataEntry.SubFormTitle>
    ) : (
      <hr className="w-full border-b border-gray-500" />
    );
  },
  SubView({
    resource: rawResource,
    formType: parentFormType,
    cellData: {
      fieldNames,
      formType,
      isButton,
      icon,
      viewName,
      sortField,
      isCollapsed,
    },
  }) {
    const fields = React.useMemo(
      () =>
        rawResource.specifyTable.getFields(
          fieldNames?.join(backboneFieldSeparator) ?? ''
        ),
      [rawResource, fieldNames]
    );
    const data = useDistantRelated(rawResource, fields);

    const relationship =
      data?.field?.isRelationship === true ? data.field : undefined;

    const isReadOnly =
      React.useContext(ReadOnlyContext) || rawResource !== data?.resource;
    const isInSearchDialog = React.useContext(SearchDialogContext);

    /*
     * SubView is turned into formTable if formTable is the default FormType for
     * the related table
     */
    const [actualFormType] = useAsyncState<FormType>(
      React.useCallback(
        async () =>
          typeof relationship === 'object'
            ? fetchView(viewName ?? relationship.relatedTable.view)
                .then((viewDefinition) =>
                  typeof viewDefinition === 'object'
                    ? resolveViewDefinition(
                        viewDefinition,
                        formType,
                        propsToFormMode(isReadOnly, isInSearchDialog)
                      )
                    : undefined
                )
                .then((definition) => definition?.formType ?? 'form')
            : undefined,
        [viewName, formType, isReadOnly, isInSearchDialog, relationship]
      ),
      false
    );

    const currentResource = data?.resource;

    const [showPickListForm, setShowPickListForm] =
      React.useState<boolean>(false);
    React.useEffect(
      () =>
        currentResource === undefined
          ? undefined
          : resourceOn(
              currentResource,
              'change:type',
              () =>
                setShowPickListForm(
                  currentResource.get('type') !== PickListTypes.ITEMS
                ),
              true
            ),
      [currentResource]
    );

    if (
      relationship === undefined ||
      currentResource === undefined ||
      actualFormType === undefined
    )
      return null;

    const pickList = toTable(currentResource, 'PickList');

    if (typeof pickList === 'object' && showPickListForm)
      return <PickListEditor relationship={relationship} resource={pickList} />;

    return isInSearchDialog ? null : (
      <ReadOnlyContext.Provider value={isReadOnly}>
        <SubView
          formType={actualFormType}
          icon={icon}
          isButton={isButton}
          isCollapsed={isCollapsed}
          parentFormType={parentFormType}
          parentResource={currentResource}
          relationship={relationship}
          sortField={sortField}
          viewName={viewName}
        />
      </ReadOnlyContext.Provider>
    );
  },
  Panel({ formType, resource, cellData: { display, definitions } }) {
    const [definitionIndex, setDefinitionIndex] = React.useState(0);
    React.useEffect(() => {
      let destructorCalled = false;
      const watchFields = f.unique(
        filterArray(
          definitions.map(({ condition }) =>
            condition?.type === 'Value' ? condition?.field[0].name : undefined
          )
        )
      );

      async function handleChange(): Promise<void> {
        let foundIndex = 0;
        for (const [index, { condition }] of Object.entries(definitions)) {
          if (condition === undefined) continue;
          if (condition.type === 'Always') {
            foundIndex = Number.parseInt(index);
            break;
          }
          const value = await fetchPathAsString(resource, condition.field);
          if (
            (!destructorCalled && value === condition.value) ||
            (condition.value === 'EMPTY' && value === '')
          ) {
            foundIndex = Number.parseInt(index);
            break;
          }
        }
        setDefinitionIndex(foundIndex);
      }

      handleChange().catch(softFail);

      const destructors = watchFields.map((fieldName) =>
        resourceOn(
          resource,
          `change:${fieldName}`,
          async () => handleChange().catch(softFail),
          false
        )
      );

      return (): void => {
        destructors.forEach((destructor) => destructor());
        destructorCalled = true;
      };
    }, [resource, definitions]);

    const isReadOnly = React.useContext(ReadOnlyContext);
    const isInSearchDialog = React.useContext(SearchDialogContext);
    const definition = definitions.at(definitionIndex)?.definition;
    const mode = propsToFormMode(isReadOnly, isInSearchDialog);
    const viewDefinition = React.useMemo(
      () =>
        definition === undefined
          ? undefined
          : {
              ...definition,
              mode,
              name: 'panel',
              formType,
              table: resource.specifyTable,
            },
      [definition, formType, resource.specifyTable, mode]
    );

    const form =
      viewDefinition === undefined ? null : (
        <SpecifyForm
          display={display}
          key={definitionIndex}
          resource={resource}
          viewDefinition={viewDefinition}
        />
      );
    return display === 'inline' ? <div className="mx-auto">{form}</div> : form;
  },
  Command({
    cellData: {
      commandDefinition: { label, commandDefinition },
    },
    id,
    resource,
  }) {
    return (
      <UiCommand
        commandDefinition={commandDefinition}
        id={id}
        label={label}
        resource={resource}
      />
    );
  },
  Blank() {
    return null;
  },
  Unsupported({ cellData: { cellType = commonText.nullInline() } }) {
    return (
      <>
        {commonText.colonLine({
          label: formsText.unsupportedCellType(),
          value: cellType,
        })}
      </>
    );
  },
};

export function FormCell({
  resource,
  cellData,
  id,
  formatId,
  formType,
  align,
  verticalAlign,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly cellData: ValueOf<CellTypes>;
  readonly id: string | undefined;
  readonly formatId: (id: string) => string;
  readonly formType: FormType;
  readonly align: typeof cellAlign[number];
  readonly verticalAlign: typeof cellVerticalAlign[number];
}): JSX.Element {
  const Render = cellRenderers[cellData.type] as typeof cellRenderers['Field'];
  return (
    <Render
      align={align}
      cellData={cellData as CellTypes['Field']}
      formatId={formatId}
      formType={formType}
      id={id}
      resource={resource}
      verticalAlign={verticalAlign}
    />
  );
}
