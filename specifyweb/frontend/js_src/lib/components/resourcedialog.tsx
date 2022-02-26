import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { Dialog, dialogClassNames } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { ResourceView } from './resourceview';

export function ResourceDialog<SCHEMA extends AnySchema = AnySchema>({
  resource,
  deletionMessage,
  onSaving: handleSaving,
  onSaved: handleSaved,
  onClose: handleClose,
  extraButton,
  readOnly = false,
  children,
}: {
  readonly resource: SpecifyResource<SCHEMA>;
  readonly deletionMessage?: string;
  readonly onSaving?: () => void;
  readonly onSaved: (addAnother: boolean) => void;
  readonly onClose: () => void;
  // TODO: remove this once RecordSetsDialog is converted to React
  readonly extraButton?: {
    readonly label: string;
    readonly onClick: () => void;
  };
  readonly readOnly?: boolean;
  readonly children?: React.ReactNode;
}): JSX.Element {
  const [title, setTitle] = React.useState('');
  return (
    <Dialog
      modal={true}
      header={title}
      onClose={handleClose}
      buttons={undefined}
      className={{ container: dialogClassNames.wideContainer }}
    >
      <ResourceView
        resource={resource}
        deletionMessage={deletionMessage}
        onSaving={handleSaving}
        onSaved={({ addAnother }) => handleSaved(addAnother)}
        onClose={handleClose}
        onChangeTitle={setTitle}
        extraButton={extraButton}
        mode={readOnly ? 'view' : 'edit'}
        canAddAnother={true}
        hasHeader={false}
      />
      {children}
    </Dialog>
  );
}

export default createBackboneView(ResourceDialog);
