import React from 'react';

import type { AnySchema } from '../components/DataModel/helperTypes';
import type { SpecifyResource } from '../components/DataModel/legacyTypes';
import {
  getFieldBlockerKey,
  useSaveBlockers,
} from '../components/DataModel/saveBlockers';
import type {
  LiteralField,
  Relationship,
} from '../components/DataModel/specifyField';
import type { Input } from '../components/Forms/validationHelpers';
import type { RA } from '../utils/types';
import { useValidation } from './useValidation';

export function useFieldValidation<INPUT extends Input = Input>(
  resource: SpecifyResource<AnySchema> | undefined,
  field: LiteralField | Relationship | undefined
): {
  // See useValidation for documentation of these props:
  readonly inputRef: React.MutableRefObject<INPUT | null>;
  readonly validationRef: React.RefCallback<INPUT>;
  readonly setValidation: (
    message: RA<string> | string,
    blockerKey?: string
  ) => void;
} {
  const [blockers, setBlockers] = useSaveBlockers(resource, field);
  const { inputRef, validationRef } = useValidation<INPUT>(blockers);

  return {
    inputRef,
    validationRef,
    setValidation: React.useCallback(
      (message, blockerKey) => {
        const blockers = typeof message === 'string' ? [message] : message;
        if (field !== undefined)
          setBlockers(
            blockers,
            blockerKey ?? getFieldBlockerKey(field, 'validation')
          );
      },
      [setBlockers, field]
    ),
  };
}
