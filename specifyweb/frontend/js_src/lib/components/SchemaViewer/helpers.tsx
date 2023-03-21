import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { IR } from '../../utils/types';

export type SchemaViewerValue =
  | number
  | string
  | readonly [number | string | undefined, JSX.Element]
  | undefined;
export type SchemaViewerRow<SHAPE extends IR<SchemaViewerValue>> = SHAPE;

export function DataModelRedirect(): null {
  const { tableName = '' } = useParams();
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate(`/specify/data-model/#${tableName}`, { replace: true });
  }, [navigate, tableName]);
  return null;
}
