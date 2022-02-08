import React from 'react';

import formsText from '../localization/forms';
import { router } from '../router';
import { schema, getModel } from '../schema';
import * as app from '../specifyapp';
import type { Relationship } from '../specifyfield';
import type { SpecifyModel } from '../specifymodel';
import { H2, Link, Ul } from './basic';
import createBackboneView from './reactbackboneextend';
import { Tables } from '../datamodel';

function RelationshipLink({
  relationship,
}: {
  readonly relationship: Relationship;
}): JSX.Element | null {
  const related = relationship.getRelatedModel();
  return typeof related === 'object' ? (
    <Link.Default
      className="intercept-navigation"
      href={`/specify/datamodel/${related.name.toLowerCase()}/`}
    >
      {related.name}
    </Link.Default>
  ) : null;
}

function DataModelView({
  model: initialModel,
}: {
  readonly model: SpecifyModel | undefined;
}): JSX.Element {
  const [model] = React.useState<SpecifyModel | undefined>(initialModel);

  return typeof model === 'object' ? (
    <>
      <H2 className="text-2xl">{model.name}</H2>
      <table>
        <tbody>
          {model.fields.map((field) => (
            <tr key={field.name}>
              <td>{field.name}</td>
              <td>{field.type}</td>
              <td>
                {field.isRelationship ? (
                  <RelationshipLink relationship={field} />
                ) : (
                  ''
                )}
              </td>
              <td>{field.dbColumn}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  ) : (
    <>
      <H2 className="text-2xl">{formsText('specifySchema')}</H2>
      <Ul>
        {Object.entries(schema.models).map(([key, model]) => (
          <li key={key}>
            <Link.Default
              href={`/specify/datamodel/${model.name.toLowerCase()}/`}
              className="intercept-navigation"
            >
              {model.name}
            </Link.Default>
          </li>
        ))}
      </Ul>
    </>
  );
}

const View = createBackboneView(DataModelView);

function view(model: string | undefined): void {
  app.setCurrentView(
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
