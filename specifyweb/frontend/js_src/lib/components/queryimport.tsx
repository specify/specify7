import React from 'react';

import type { SpQuery } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { f } from '../functools';
import { removeKey, replaceKey } from '../helpers';
import { commonText } from '../localization/common';
import { schema } from '../schema';
import type { RA } from '../types';
import { defined } from '../types';
import { getUniqueName } from '../wbuniquifyname';
import { Form, Submit } from './basic';
import { LoadingContext } from './contexts';
import { FilePicker, fileToText } from './filepicker';
import { icons } from './icons';
import { Dialog, LoadingScreen } from './modaldialog';
import { useNavigate } from 'react-router-dom';

export function QueryImport({
  onClose: handleClose,
  queries,
}: {
  readonly onClose: () => void;
  readonly queries: RA<SerializedResource<SpQuery>> | undefined;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const navigate = useNavigate();
  return typeof queries === 'object' ? (
    <Dialog
      buttons={commonText('cancel')}
      header={commonText('import')}
      icon={<span className="text-blue-500">{icons.documentSearch}</span>}
      onClose={handleClose}
    >
      <Form>
        <FilePicker
          acceptedFormats={['.json']}
          onSelected={(file): void =>
            loading(
              fileToText(file)
                .then<SerializedResource<SpQuery>>(f.unary(JSON.parse))
                .then(
                  (query) =>
                    new schema.models.SpQuery.Resource(
                      removeKey(
                        replaceKey(
                          query,
                          'fields',
                          query.fields.map((field) =>
                            replaceKey(field, 'id', null)
                          )
                        ),
                        'id'
                      )
                    )
                )
                .then((queryResource) =>
                  queryResource.set(
                    'name',
                    getUniqueName(
                      queryResource.get('name'),
                      queries.map(({ name }) => name),
                      defined(schema.models.SpQuery.getLiteralField('name'))
                        .length
                    )
                  )
                )
                .then(async (queryResource) => queryResource.save())
                .then((queryResource) =>
                  navigate(`/specify/query/${queryResource.id}/`)
                )
            )
          }
        />
        {/* This button is never actually clicked. */}
        <Submit.Green className="sr-only" disabled>
          {commonText('import')}
        </Submit.Green>
      </Form>
    </Dialog>
  ) : (
    <LoadingScreen />
  );
}
