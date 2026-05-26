import React from 'react';

import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { createXmlContext, XmlEditor } from '../Formatters';
import { fieldFormattersRoutes } from './Routes';
import { fieldFormattersSpec } from './spec';

export function FieldFormattersEditor(props: AppResourceTabProps): JSX.Element {
  return (
    <XmlEditor
      context={FieldFormattersContext}
      props={props}
      rootTagName="formatters"
      routes={fieldFormattersRoutes}
      spec={fieldFormattersSpec()}
    />
  );
}

export const FieldFormattersContext = createXmlContext(fieldFormattersSpec());
