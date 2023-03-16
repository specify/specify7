import React from 'react';

import { useLiveState } from '../../hooks/useLiveState';
import { useIndent } from '../AppResources/EditorComponents';
import { AppResourceTextEditor } from '../AppResources/TabDefinitions';
import type { BaseSpec } from '../Syncer';
import type { SimpleXmlNode } from '../Syncer/xmlToJson';
import { updateXml } from '../Syncer/xmlToJson';
import type { XmlEditorContext, XmlEditorProps } from './index';
import { WrappedXmlEditor } from './index';
import { SpecifyTable } from '../DataModel/specifyTable';
import { FieldBase } from '../DataModel/specifyField';

/**
 * Use the syncer library for xml<-->json synchronization to
 * create a JSON editor for an XML resource
 */
export function JsonEditorForXml<SPEC extends BaseSpec<SimpleXmlNode>>(
  rest: Omit<XmlEditorProps<SPEC>, 'context' | 'routes'>
): JSX.Element {
  return (
    <WrappedXmlEditor<SPEC> {...rest}>
      {(props): JSX.Element => <JsonEditor<SPEC> {...props} />}
    </WrappedXmlEditor>
  );
}

function JsonEditor<SPEC extends BaseSpec<SimpleXmlNode>>({
  parsed: [parsed],
  xmlNode,
  syncer: { deserializer },
  onChange: handleChange,
  ...rest
}: XmlEditorContext<SPEC>): JSX.Element {
  const indentSize = useIndent();
  const [data, setData] = useLiveState(
    React.useCallback(
      () => JSON.stringify(parsed, null, indentSize),
      [parsed, indentSize]
    )
  );

  function handleChanged(data: string): void {
    setData(data);
    handleChange(() => {
      try {
        const parsed = JSON.parse(data, (_key, value) =>
          typeof value === 'string'
            ? SpecifyTable.fromJson(value) ?? FieldBase.fromJson(value) ?? value
            : value
        );
        return updateXml(xmlNode, deserializer(parsed));
      } catch (error) {
        console.error(error);
        return undefined;
      }
    });
  }

  const resource = React.useMemo(
    () => ({ ...rest.resource, mimeType: 'application/json' }),
    [rest.resource]
  );
  return (
    <AppResourceTextEditor
      {...rest}
      data={data}
      resource={resource}
      onChange={handleChanged}
    />
  );
}
