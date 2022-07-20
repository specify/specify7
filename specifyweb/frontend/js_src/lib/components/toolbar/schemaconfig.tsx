/**
 * Schema Configuration
 */

import React from 'react';

import { commonText } from '../../localization/common';
import { hasToolPermission } from '../../permissionutils';
import { ErrorBoundary } from '../errorboundary';
import { useTitle } from '../hooks';
import type { UserTool } from '../main';
import type {
  NewSpLocaleItemString,
  SpLocaleItemString,
} from '../schemaconfig';
import { SchemaConfigLanguage } from '../schemaconfigsetup';
import { useSchemaData } from '../schemaconfigsetuphooks';

export type WithFetchedStrings = {
  readonly strings: {
    readonly desc: NewSpLocaleItemString | SpLocaleItemString;
    readonly name: NewSpLocaleItemString | SpLocaleItemString;
  };
};

function SchemaConfigWrapper({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element | null {
  useTitle(commonText('schemaConfig'));

  const schemaData = useSchemaData();

  return schemaData === undefined ? null : (
    <SchemaConfigLanguage schemaData={schemaData} onClose={handleClose} />
  );
}

export const userTool: UserTool = {
  task: 'schema-config',
  title: commonText('schemaConfig'),
  isOverlay: true,
  view: ({ onClose: handleClose }) => (
    <ErrorBoundary dismissable>
      <SchemaConfigWrapper onClose={handleClose} />
    </ErrorBoundary>
  ),
  enabled: () => hasToolPermission('schemaConfig', 'read'),
  groupLabel: commonText('customization'),
};
