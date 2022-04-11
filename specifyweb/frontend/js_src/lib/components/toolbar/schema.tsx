import React from 'react';

import type { Tables } from '../../datamodel';
import formsText from '../../localization/forms';
import { router } from '../../router';
import { getModel, schema } from '../../schema';
import { setCurrentView } from '../../specifyapp';
import type { SpecifyModel } from '../../specifymodel';
import { className, Container, H2, H3, Link } from '../basic';
import createBackboneView from '../reactbackboneextend';
import commonText from '../../localization/common';
import { fieldFormat, resolveParser } from '../../uiparse';
import { RA } from '../../types';
import { TableIcon } from '../common';
import { UserTool } from '../main';
import { useTitle } from '../hooks';

function Table({
  children,
  headers,
}: {
  readonly headers: RA<string>;
  readonly children: RA<JSX.Element>;
}): JSX.Element {
  return (
    <div
      role="table"
      className="grid-table grid-cols-[repeat(var(--cols),auto)] border flex-1 overflow-auto"
      style={{ '--cols': headers.length } as React.CSSProperties}
    >
      <div role="row">
        {headers.map((label, index) => (
          <div
            key={index}
            role="columnheader"
            className={`sticky top-0 p-2 font-bold border ${className.rootBackground}`}
          >
            {label}
          </div>
        ))}
      </div>
      <div role="rowgroup">{children}</div>
    </div>
  );
}

function Cell({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <div role="cell" className="p-2 border">
      {children}
    </div>
  );
}

function DataModelView({
  model: initialModel,
}: {
  readonly model: SpecifyModel | undefined;
}): JSX.Element {
  useTitle(commonText('datamodel'));

  const [model] = React.useState<SpecifyModel | undefined>(initialModel);
  const parser = React.useMemo(
    () =>
      resolveParser(
        {},
        {
          type: 'java.lang.Boolean',
        }
      ),
    []
  );
  const booleanFormatter = (value: boolean): string =>
    fieldFormat(undefined, parser, value);

  return typeof model === 'object' ? (
    <Container.Full>
      <div className="flex items-center gap-2">
        <TableIcon name={model.name} />
        <H2 className="text-2xl">{model.name}</H2>
      </div>
      <H3>{commonText('fields')}</H3>
      <Table
        headers={[
          commonText('name'),
          commonText('label'),
          commonText('description'),
          commonText('hidden'),
          commonText('readOnly'),
          commonText('required'),
          commonText('type'),
          commonText('length'),
          commonText('databaseColumn'),
        ]}
      >
        {model.literalFields.map((field) => (
          <div role="row" key={field.name}>
            {[
              field.name,
              field.label,
              field.getLocalizedDesc(),
              booleanFormatter(field.isHidden),
              booleanFormatter(field.isReadOnly),
              booleanFormatter(field.isRequired),
              field.type,
              field.length,
              field.dbColumn,
            ].map((label, index) => (
              <Cell key={index}>{label}</Cell>
            ))}
          </div>
        ))}
      </Table>
      <H3>{commonText('relationships')}</H3>
      <Table
        headers={[
          commonText('name'),
          commonText('label'),
          commonText('description'),
          commonText('hidden'),
          commonText('readOnly'),
          commonText('required'),
          commonText('type'),
          commonText('databaseColumn'),
          commonText('relatedModel'),
          commonText('otherSideName'),
          commonText('dependent'),
        ]}
      >
        {model.relationships.map((field) => (
          <Link.Default
            key={field.name}
            role="row"
            href={`/specify/datamodel/${field.name.toLowerCase()}/`}
          >
            {[
              field.name,
              field.label,
              field.getLocalizedDesc(),
              booleanFormatter(field.isHidden),
              booleanFormatter(field.isReadOnly),
              booleanFormatter(field.isRequired),
              field.type,
              field.dbColumn,
              field.relatedModel.name,
              field.otherSideName,
              booleanFormatter(field.dependent),
            ].map((label, index) => (
              <Cell key={index}>{label}</Cell>
            ))}
          </Link.Default>
        ))}
      </Table>
    </Container.Full>
  ) : (
    <Container.Full>
      <H2 className="text-2xl">{formsText('specifySchema')}</H2>
      <Link.NewTab href="/context/datamodel.json">
        {commonText('viewAsJson')}
      </Link.NewTab>
      <Table
        headers={[
          commonText('name'),
          commonText('label'),
          commonText('system'),
          commonText('hidden'),
          commonText('tableId'),
          commonText('fieldCount'),
          commonText('relationshipCount'),
        ]}
      >
        {Object.entries(schema.models).map(([key, model]) => (
          <Link.Default
            key={key}
            href={`/specify/datamodel/${model.name.toLowerCase()}/`}
            role="row"
          >
            {[
              model.name,
              model.label,
              booleanFormatter(model.isSystem),
              booleanFormatter(model.isHidden),
              model.tableId,
              model.fields.length,
              model.relationships.length,
            ].map((label, index) => (
              <Cell key={index}>{label}</Cell>
            ))}
          </Link.Default>
        ))}
      </Table>
    </Container.Full>
  );
}

const View = createBackboneView(DataModelView);

function view(model: string | undefined): void {
  setCurrentView(
    new View({
      model:
        typeof model === 'string' ? getModel(model as keyof Tables) : undefined,
    })
  );
}

export default function Routes(): void {
  router.route('datamodel/:model/', 'datamodel', view);
  router.route('datamodel/', 'datamodel', view);
}

export const toolBarItem: UserTool = {
  task: 'schema',
  title: commonText('datamodel'),
  isOverlay: false,
  view: '/specify/datamodel/',
  groupLabel: commonText('developers'),
};
