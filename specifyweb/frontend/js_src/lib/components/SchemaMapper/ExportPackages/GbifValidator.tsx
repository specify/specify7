import React from 'react';

import { Button } from '../../Atoms/Button';

const GBIF_VALIDATOR_URL = 'https://www.gbif.org/tools/data-validator';

export function GbifValidatorLink(): JSX.Element {
  return (
    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
      <p className="mb-1">Validate your archive against GBIF standards:</p>
      <Button.Small
        onClick={() => window.open(GBIF_VALIDATOR_URL, '_blank')}
      >
        Open GBIF Data Validator
      </Button.Small>
    </div>
  );
}
