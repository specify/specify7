import { ajax, Http } from './ajax';
import type { FormCellDefinition } from './parseformcells';
import {
  parseFormCellDefinition,
  processColumnDefinition,
} from './parseformcells';
import * as queryString from './querystring';
import { getModel } from './schema';
import { SpecifyModel } from './specifymodel';
import type { IR, R, RA } from './types';
import { defined } from './types';
import { f } from './wbplanviewhelper';

const columnDefinitionsPlatform = 'lnx';
const getColumnDefinitions = (viewDefinition: Element): string =>
  defined(
    viewDefinition.querySelector(
      `columnDef[os="${columnDefinitionsPlatform}"], columnDef, colDef`
    ) ?? undefined
  ).textContent ?? '';

export type ParsedFormDefinition = {
  readonly columns: RA<number | undefined>;
  readonly rows: RA<RA<FormCellDefinition>>;
};

function parseFormTableDefinition(
  viewDefinition: Element
): ParsedFormDefinition {
  const cells = Array.from(
    viewDefinition.querySelectorAll('cell[type="field"], cell[type="subview"]'),
    parseFormCellDefinition
  );
  return {
    columns: cells.map(f.undefined),
    rows: [cells],
  };
}

export const parseFormDefinition = (
  viewDefinition: Element
): ParsedFormDefinition => ({
  columns: processColumnDefinition(getColumnDefinitions(viewDefinition)),
  rows: Array.from(viewDefinition.querySelectorAll('rows > row'), (row) =>
    Array.from(row.querySelectorAll('cell'), parseFormCellDefinition)
  ),
});

function processViewDefinition(
  view: ViewDefinition,
  formType: FormType,
  mode: FormMode
): {
  readonly viewDefinition: Element;
  readonly formType: FormType;
  readonly mode: FormMode;
  readonly model: SpecifyModel;
} {
  let altViews: RA<AltView> = Object.values(view.altviews).filter(
    (altView) => altView.mode === mode
  );
  if (altViews.length === 0) altViews = Object.values(view.altviews);

  const viewDefinitions = Object.fromEntries(
    Object.entries(view.viewdefs).map(([name, xml]) => [
      name,
      new window.DOMParser()
        .parseFromString(xml, 'text/xml')
        .getElementsByTagName('viewdef')[0],
    ])
  );

  let viewDefinition;
  let altView = altViews.find((altView) => {
    viewDefinition = viewDefinitions[altView.viewdef];
    return viewDefinition.getAttribute('type') === formType;
  });
  if (typeof altView === 'undefined' || typeof viewDefinition === 'undefined') {
    console.error('No altView for defaultType:', formType);
    altView = altViews[0];
    viewDefinition = viewDefinitions[altView.viewdef];
  }

  const definition =
    viewDefinition.getElementsByTagName('definition')[0].textContent;
  const actualViewDefinition =
    typeof definition === 'string'
      ? viewDefinitions[definition]
      : viewDefinition;

  return {
    viewDefinition: actualViewDefinition,
    formType: (viewDefinition.getAttribute('type') as FormType) ?? 'form',
    mode: altView.mode,
    model: defined(
      getModel(
        SpecifyModel.parseClassName(
          defined(actualViewDefinition.getAttribute('class') ?? undefined)
        )
      )
    ),
  };
}

// FIXME: reorder this file as makes sense
export type ViewDescription = ParsedFormDefinition & {
  readonly formType: FormType;
  readonly mode: FormMode;
  readonly model: SpecifyModel | undefined;
};

export function parseViewDefinition(
  view: ViewDefinition,
  defaultType: FormType,
  originalMode: FormMode
): ViewDescription {
  const { mode, formType, viewDefinition, model } = processViewDefinition(
    view,
    defaultType,
    originalMode
  );
  const parser =
    formType === 'formtable' ? parseFormTableDefinition : parseFormDefinition;
  return {
    mode,
    formType,
    model,
    ...parser(viewDefinition),
  };
}

type AltView = {
  readonly default: 'true' | 'false';
  readonly mode: FormMode;
  readonly name: string;
  readonly viewdef: string;
};

type ViewDefinition = {
  readonly altviews: IR<AltView>;
  readonly busrules: string;
  readonly class: string;
  readonly name: string;
  readonly resourcelabels: 'true' | 'false';
  readonly viewdefs: IR<string>;
  readonly viewsetLevel: string;
  readonly viewsetName: string;
  readonly viewsetSource: string;
};

const views: R<ViewDefinition> = {};
export const getView = async (name: string): Promise<ViewDefinition> =>
  name in views
    ? Promise.resolve(views[name])
    : ajax<ViewDefinition>(
        queryString.format('/context/view.json', { name }),
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'application/json' },
        },
        {
          expectedResponseCodes: [Http.OK, Http.NOT_FOUND],
        }
      ).then(({ data, status }) => {
        if (status === Http.NOT_FOUND) throw new Error('Form not found');
        views[name] = data;
        return data;
      });

export const formTypes = ['form', 'formtable'];
export type FormType = 'form' | 'formtable';
export type FormMode = 'edit' | 'view' | 'search';
