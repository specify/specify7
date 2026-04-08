/**
 * ClonePackage — Clones an ExportDataSet by calling the backend clone
 * endpoint, then opens the new package in the PackageForm for editing.
 */

import React from 'react';

import { ajax } from '../../../utils/ajax';
import { LoadingScreen } from '../../Molecules/Dialog';
import { PackageForm } from './PackageForm';

export function ClonePackage({
  sourceId,
  onClose,
}: {
  readonly sourceId: number;
  readonly onClose: () => void;
}): JSX.Element {
  const [clonedId, setClonedId] = React.useState<number | undefined>(
    undefined
  );
  const [error, setError] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;

    async function doClone(): Promise<void> {
      try {
        // Clone the core mapping first (the backend will also clone
        // extensions in a future iteration).
        const response = await ajax<{ readonly id: number }>(
          `/export/clone_dataset/${sourceId}/`,
          {
            method: 'POST',
            headers: { Accept: 'application/json' },
          }
        );
        if (!cancelled) {
          setClonedId(response.data.id);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Clone failed'
          );
        }
      }
    }

    doClone().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [sourceId]);

  if (error !== undefined) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <p className="text-red-600">Failed to clone package: {error}</p>
        <button
          className="self-start rounded bg-gray-200 px-3 py-1"
          type="button"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    );
  }

  if (clonedId === undefined) {
    return <LoadingScreen />;
  }

  return <PackageForm datasetId={clonedId} onClose={onClose} />;
}
