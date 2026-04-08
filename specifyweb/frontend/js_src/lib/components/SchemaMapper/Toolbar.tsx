import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { headerText } from '../../localization/header';
import { Button } from '../Atoms/Button';
import type { MappingField } from './types';

export function findDuplicateTerms(
  fields: ReadonlyArray<MappingField>
): ReadonlyArray<string> {
  const terms = fields
    .map((field) => field.term)
    .filter((term): term is string => term !== undefined);
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const term of terms) {
    if (seen.has(term)) duplicates.add(term);
    seen.add(term);
  }
  return [...duplicates];
}

export function MappingToolbar({
  onSave: handleSave,
  isRunning,
  fields,
}: {
  readonly onSave: () => void;
  readonly isRunning: boolean;
  readonly fields: ReadonlyArray<MappingField>;
}): JSX.Element {
  const [error, setError] = React.useState<string | undefined>(undefined);

  function handleSaveClick(): void {
    const duplicateTerms = findDuplicateTerms(fields);
    if (duplicateTerms.length > 0) {
      setError(
        headerText.duplicateTermsError({
          terms: duplicateTerms.join(', '),
        })
      );
      return;
    }
    setError(undefined);
    handleSave();
  }

  return (
    <div className="flex items-center gap-3">
      <Button.Save
        disabled={isRunning}
        onClick={isRunning ? undefined : handleSaveClick}
      >
        {headerText.saveMapping()}
      </Button.Save>
      {error !== undefined && (
        <span className="text-sm text-red-600 dark:text-red-400">
          {error as LocalizedString}
        </span>
      )}
    </div>
  );
}
