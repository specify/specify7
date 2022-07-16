import React from 'react';

import type { AnySchema } from '../datamodelutils';
import { format } from '../dataobjformatters';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import type { Relationship } from '../specifyfield';
import type { SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { Button } from './basic';
import { TableIcon } from './common';
import { useAsyncState } from './hooks';
import { Dialog, dialogClassNames } from './modaldialog';
import { ResourceView } from './resourceview';

export type DeleteBlocker = {
  model: SpecifyModel;
  field: string;
  id: number;
};

export function DeleteBlocked({
  resource: parentResource,
  blockers,
  onClose: handleClose,
  onDeleted: handleDeleted,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly blockers: RA<DeleteBlocker>;
  readonly onClose: () => void;
  readonly onDeleted: () => void;
}): JSX.Element | null {
  const [preview, setPreview] = React.useState<
    | {
        readonly resource: SpecifyResource<AnySchema>;
        readonly field: Relationship | undefined;
      }
    | undefined
  >(undefined);

  const [data, setData] = useAsyncState(
    React.useCallback(
      async () =>
        Promise.all(
          blockers.map(async ({ model, field, id }) => {
            const resource = new model.Resource({ id });
            return f.all({
              field:
                parentResource.specifyModel.getRelationship(field) ?? field,
              resource,
              formatted: await format(resource, undefined, true),
            });
          })
        ),
      [blockers]
    ),
    true
  );
  React.useEffect(
    () =>
      Array.isArray(data) && data.length === 0 ? handleDeleted() : undefined,
    [data, handleDeleted]
  );

  return Array.isArray(data) ? (
    typeof preview === 'object' ? (
      <BlockerPreview
        resource={preview.resource}
        parentResource={parentResource}
        field={preview.field}
        onClose={(): void => setPreview(undefined)}
        onDeleted={(): void =>
          setData(data.filter(({ resource }) => resource !== preview.resource))
        }
      />
    ) : (
      <Dialog
        header={formsText('deleteBlockedDialogHeader')}
        buttons={commonText('close')}
        onClose={handleClose}
        className={{
          container: dialogClassNames.narrowContainer,
        }}
      >
        {formsText('deleteBlockedDialogText')}
        <table className="grid-table grid-cols-[auto_auto] gap-2">
          <thead>
            <tr>
              <th scope="col">{formsText('record')}</th>
              <th scope="col">{formsText('relationship')}</th>
            </tr>
          </thead>
          <tbody>
            {data.map(({ formatted, field, resource }, index) => (
              <tr key={index}>
                <td>
                  <Button.LikeLink
                    onClick={(): void =>
                      setPreview({
                        resource,
                        field: typeof field === 'object' ? field : undefined,
                      })
                    }
                    className="text-left"
                  >
                    <TableIcon name={resource.specifyModel.name} label />
                    {`${formatted ?? resource.viewUrl()}`}
                  </Button.LikeLink>
                </td>
                <td>{typeof field === 'object' ? field.label : field}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Dialog>
    )
  ) : null;
}

function BlockerPreview({
  resource,
  parentResource,
  field,
  onClose: handleClose,
  onDeleted: handleDeleted,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly parentResource: SpecifyResource<AnySchema>;
  readonly field: Relationship | undefined;
  readonly onClose: () => void;
  readonly onDeleted: () => void;
}): JSX.Element {
  return (
    <ResourceView
      resource={resource}
      mode="edit"
      canAddAnother={false}
      dialog="modal"
      onSaved={() => {
        if (
          typeof field === 'object' &&
          resource.get(field.name) !== parentResource.get('resource_uri')
        )
          handleDeleted();
        handleClose();
      }}
      onDeleted={(): void => {
        handleDeleted();
        handleClose();
      }}
      onClose={handleClose}
      isSubForm={false}
      isDependent={false}
    />
  );
}
