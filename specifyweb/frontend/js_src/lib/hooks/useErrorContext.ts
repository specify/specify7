import React from 'react';

/**
 * Stores information about the current context, which could be useful to debug
 * a user reported error. The error context is included in the crash report.
 *
 * For example, when opening WorkBench, errorContext would contain the data
 * set. When opening a record set, errorContext would contain record set,
 * displayed record, and the form definitions of all displayed forms.
 */
export const errorContext = new Set<unknown>();

export function useErrorContext(name: string, data: unknown): void {
  React.useEffect(() => {
    const fullData = {
      timestamp: new Date().toJSON(),
      name,
      payload: data,
    };
    errorContext.add(fullData);
    return (): void => void errorContext.delete(fullData);
  }, [name, data]);
}
