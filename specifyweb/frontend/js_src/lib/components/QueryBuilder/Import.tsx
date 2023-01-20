import React from 'react';

import type { SpQuery } from '../DataModel/types';
import { f } from '../../utils/functools';
import { removeKey, replaceKey } from '../../utils/utils';
import { commonText } from '../../localization/common';
import { schema } from '../DataModel/schema';
import type { RA } from '../../utils/types';
import { getUniqueName } from '../../utils/uniquifyName';
import { LoadingContext } from '../Core/Contexts';
import { FilePicker, fileToText } from '../Molecules/FilePicker';
import { icons } from '../Atoms/Icons';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { useNavigate } from 'react-router-dom';
import { Form } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { SerializedResource } from '../DataModel/helperTypes';
import { getField } from '../DataModel/helpers';

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
      buttons={commonText.cancel()}
      header={commonText.import()}
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
                            replaceKey(
                              field,
                              'id',
                              undefined as unknown as null
                            )
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
                      getField(schema.models.SpQuery, 'name').length
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
          {commonText.import()}
        </Submit.Green>
      </Form>
    </Dialog>
  ) : (
    <LoadingScreen />
  );
}
