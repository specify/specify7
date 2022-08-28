import React from 'react';

import type { SpQuery } from '../DataModel/types';
import type { SerializedResource } from '../DataModel/helpers';
import { f } from '../../utils/functools';
import { removeKey, replaceKey } from '../../utils/utils';
import { commonText } from '../../localization/common';
import { schema } from '../DataModel/schema';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { getUniqueName } from '../../utils/uniquifyName';
import { Form, Submit } from '../Atoms/Basic';
import { LoadingContext } from '../Core/Contexts';
import { FilePicker, fileToText } from '../Molecules/FilePicker';
import { icons } from '../Atoms/Icons';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
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
