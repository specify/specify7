import React from 'react';
import { Button } from '../Atoms/Button';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { AnySchema } from '../DataModel/helperTypes';

export function NewDeleteBlockers({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}) {
  // [page, setPage] = useDeleteBlockers
  // const [currentRel, setRel] =

  return (
    <div className="relative flex flex-1 gap-4 overflow-hidden md:flex-row">
      <DeleteBlockersAside />
      <div className="ml-2">{/* Paginator goes here */}</div>
    </div>
  );
}

function DeleteBlockersAside({
  resources,
}: {
  readonly resources: SpecifyResource<AnySchema>;
}): JSX.Element {
  return (
    <aside
      className="left-0 hidden min-w-fit flex-1 flex-col divide-y-4
        divide-[color:var(--form-background)] overflow-y-auto md:flex"
    >
      {/* FOR TABLE IN direct blockers */}
      <Button.Secondary aria-pressed onClick={setPaginator}>
        Accession
      </Button.Secondary>
      <DeleteBlockersTable />
      {/* FOR RESOURCE IN CASCADED Direct Blockers */}
      <DeleteBlockersTable />
    </aside>
  );
}

function DeleteBlockersTable(parentResource, table, rels) {
  // for rel in rels: rended button to set paginator
}

function DeleteBlockersPaginator(parentResource, rel) {}
