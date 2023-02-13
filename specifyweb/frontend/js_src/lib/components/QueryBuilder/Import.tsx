import React from 'react';
import { useNavigate } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { getUniqueName } from '../../utils/uniquifyName';
import { removeKey, replaceKey } from '../../utils/utils';
import { Form } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpQuery } from '../DataModel/types';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { FilePicker, fileToText } from '../Molecules/FilePicker';
import { tables } from '../DataModel/tables';

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
                    new tables.SpQuery.Resource(
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
                      getField(tables.SpQuery, 'name').length
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
