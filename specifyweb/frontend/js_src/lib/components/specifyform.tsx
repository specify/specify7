import React from 'react';

import { error } from '../assert';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import formsText from '../localization/forms';
import type { FormMode, FormType, ViewDescription } from '../parseform';
import { getView, parseViewDefinition } from '../parseform';
import { f } from '../wbplanviewhelper';
import { FormHeader, H2 } from './basic';
import { useAsyncState, useId } from './hooks';
import { FormCell } from './specifyformcell';

const getAttachmentFormDefinition = (defaultType: FormType, mode: FormMode) =>
  ({
    columns: [undefined],
    formType: defaultType,
    mode,
    model: undefined,
    rows: [
      [
        {
          id: undefined,
          cellData: {
            type: 'Field',
            fieldName: '',
            fieldDefinition: {
              isReadOnly: false,
              fieldDefinition: {
                type: 'Plugin',
                defaultValue: undefined,
              },
            },
            properties: {},
            isRequired: false,
            ignore: false,
            printOnSave: false,
          },
          colSpan: undefined,
        },
      ],
    ],
  } as const);

/*
 * FIXME: migrate props in usages and replace populateForm
 * FIXME: replace buildViewByName with this
 * FIXME: review all original files to check everything was migrated
 */
export function Form({
  resource,
  viewName,
  defaultType,
  mode,
  hasHeader,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly viewName: string;
  readonly defaultType: FormType;
  readonly mode: FormMode;
  readonly hasHeader: boolean;
}): JSX.Element {
  const [viewDefinition] = useAsyncState<ViewDescription | false>(
    React.useCallback(
      async () =>
        viewName === 'ObjectAttachment'
          ? getAttachmentFormDefinition(defaultType, mode)
          : getView(viewName)
              .catch(f.undefined)
              .then((viewDefinition) =>
                typeof viewDefinition === 'object'
                  ? parseViewDefinition(viewDefinition, defaultType, mode)
                  : undefined
              )
              .then((viewDefinition) =>
                typeof viewDefinition === 'object' &&
                viewDefinition.model !== resource.specifyModel
                  ? error('View definition model does not match resource model')
                  : viewDefinition
              ),
      [viewName, defaultType, mode, resource]
    )
  );

  return viewDefinition === false ? (
    <section>
      <H2>{formsText('missingFormDefinitionPageHeader')}</H2>
      <p>{formsText('missingFormDefinitionPageContent')}</p>
    </section>
  ) : (
    <RenderForm
      resource={resource}
      viewDefinition={viewDefinition}
      hasHeader={hasHeader}
    />
  );
}

export function RenderForm({
  resource,
  viewDefinition,
  hasHeader,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly viewDefinition: ViewDescription | undefined;
  readonly hasHeader: boolean;
}): JSX.Element {
  const id = useId(resource.specifyModel.name ?? 'form');
  return (
    <div className="gap-y-2 flex flex-col">
      {hasHeader && <FormHeader>{resource.specifyModel.name}</FormHeader>}
      {typeof viewDefinition === 'object' && (
        <div
          className="grid"
          style={{
            gridTemplateColumns: viewDefinition.columns
              .map((width) =>
                typeof width === 'number' ? `${width}px` : 'auto'
              )
              .join(' '),
          }}
        >
          {/* Cells are wrapped in rows for debugging purposes only */}
          {viewDefinition.rows.map((cells, index) => (
            <div className="contents" key={index}>
              {cells.map(({ colSpan, id: cellId, ...cellData }, index) => (
                <div
                  key={index}
                  style={
                    typeof colSpan === 'number'
                      ? {
                          gridColumn: `span ${colSpan} / span ${colSpan}`,
                        }
                      : undefined
                  }
                >
                  <FormCell
                    resource={resource}
                    mode={viewDefinition.mode}
                    cellData={cellData}
                    id={cellId}
                    formatId={id}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// FIXME: remove the need for all of this
`
var specifyform = {
  async buildSubView(node, mode) {
    node = $(node);
    const defaultType = specifyform.getSubViewType(node);
    mode =
      mode === 'view' || specifyform.subViewMode(node) === 'view'
        ? 'view'
        : 'edit';
    const viewName = node.data('specify-viewname');
    const buildView = specifyform.buildViewByName(
      viewName,
      defaultType,
      mode,
      true
    );

    return buildView.then(function (form) {
      form
        .find('.specify-form-header:first, .specify-form-footer button')
        .remove();
      return form;
    });
  },

  getSubViewType(node) {
    /*
     * This the form type desired by the superform. May or may not be respected
     * when the form is actually built.
     */
    return $(node).data('specify-viewtype') === 'table' ? 'formtable' : 'form';
  },

  isSubViewButton(node) {
    return $(node).is('.specify-subview-button');
  },

  subViewMode(node) {
    return $(node).data('specify-viewmode');
  },

  getFormMode(node) {
    return $(node).data('specify-form-mode');
  },
};
`;
