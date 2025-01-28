import React from 'react';
import { useParams } from 'react-router-dom';

import { resourcesText } from '../../localization/resources';
import { ReadOnlyContext } from '../Core/Contexts';
import { makeXmlEditorShellSlot, XmlEditorShell } from '../Formatters/Element';
import { FieldFormatterElement } from './FieldFormatter';
import type { FieldFormattersOutlet } from './List';
import type { FieldFormatter } from './spec';

export function FieldFormatterWrapper(): JSX.Element {
  const { index } = useParams();
  const isReadOnly = React.useContext(ReadOnlyContext);
  return (
    <XmlEditorShell<FieldFormatter, FieldFormattersOutlet>
      header={resourcesText.fieldFormatters()}
    >
      {makeXmlEditorShellSlot(
        (getSet) => (
          <FieldFormatterElement item={getSet} />
        ),
        index,
        isReadOnly
      )}
    </XmlEditorShell>
  );
}
