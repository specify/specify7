import React from 'react';
import { useNavigate } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { wbPlanText } from '../../localization/wbPlan';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { getUniqueName } from '../../utils/uniquifyName';
import { removeKey, replaceKey } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Form } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { getField } from '../DataModel/helpers';
import type {
  SerializedModel,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceApiUrl } from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import type { SpQuery } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { FilePicker, fileToText } from '../Molecules/FilePicker';
import { TableIcon } from '../Molecules/TableIcon';
import { generateMappingPathPreview } from '../WbPlanView/mappingPreview';
import { QueryFieldSpec } from './fieldSpec';

export function QueryImport({
  onClose: handleClose,
  queries,
}: {
  readonly onClose: () => void;
  readonly queries: RA<SerializedResource<SpQuery>> | undefined;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const navigate = useNavigate();

  const [hiddenFields, setHiddenFields] = React.useState<RA<QueryFieldSpec>>(
    []
  );

  const [queryResource, setQueryResource] = React.useState<
    SpecifyResource<SpQuery> | undefined
  >(undefined);

  React.useEffect(() => {
    if (hiddenFields.length <= 0 && queryResource !== undefined)
      navigate(`/specify/query/${queryResource.id}/`);
  }, [queryResource, hiddenFields]);

  return typeof queries === 'object' ? (
    <Dialog
      buttons={commonText.cancel()}
      header={commonText.import()}
      icon={<span className="text-blue-500">{icons.documentSearch}</span>}
      onClose={handleClose}
    >
      <>
        <Form>
          <FilePicker
            acceptedFormats={['.json']}
            onSelected={(file): void =>
              loading(
                fileToText(file)
                  .then<SerializedModel<SpQuery>>(f.unary(JSON.parse))
                  .then((query) => ({
                    ...query,
                    specifyuser: getResourceApiUrl(
                      'SpecifyUser',
                      userInformation.id
                    ),
                    modifiedbyagent: null,
                    createdbyagent: null,
                    fields: query.fields.map((field) => ({
                      ...field,
                      modifiedbyagent: null,
                      createdbyagent: null,
                    })),
                  }))
                  .then((query) => {
                    setHiddenFields(
                      filterArray(
                        query.fields.map((field) => {
                          const fieldSpec = QueryFieldSpec.fromStringId(
                            field.stringid,
                            field.isrelfld ?? false
                          );
                          const isHidden = fieldSpec.joinPath.some(
                            ({ isHidden }) => isHidden
                          );
                          return isHidden ? fieldSpec : undefined;
                        })
                      )
                    );
                    return query;
                  })
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
                  .then(setQueryResource)
              )
            }
          />
          {/* This button is never actually clicked. */}
          <Submit.Green className="sr-only" disabled>
            {commonText.import()}
          </Submit.Green>
        </Form>
        {hiddenFields.length > 0 && (
          <Dialog
            buttons={commonText.close()}
            header={wbPlanText.hiddenFields()}
            onClose={(): void => setHiddenFields([])}
          >
            <>
              {queryText.importHiddenFields()}
              <Ul className="flex flex-col items-center">
                {hiddenFields.map((field, index) => (
                  <li className="font-bold" key={index}>
                    <div className="flex gap-2">
                      <TableIcon label name={field.baseTable.name} />
                      {generateMappingPathPreview(
                        field.baseTable.name,
                        field.toMappingPath()
                      )}
                    </div>
                  </li>
                ))}
              </Ul>
            </>
          </Dialog>
        )}
      </>
    </Dialog>
  ) : (
    <LoadingScreen />
  );
}
