import React from 'react';

import { resourcesText } from '../../localization/resources';
import { schemaText } from '../../localization/schema';
import type { GetSet } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { ReadOnlyContext } from '../Core/Contexts';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { ResourceMapping } from '../Formatters/Components';
import type { WebLink } from './spec';

export function WebLinkDefinition({
  item: [item, setItem],
}: {
  readonly item: GetSet<WebLink>;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const handleChange = (parts: WebLink['parts']): void =>
    setItem({
      ...item,
      parts,
    });
  return (
    <>
      <H3>{resourcesText.definition()}:</H3>
      <Ul className="grid grid-cols-[auto_1fr_auto] gap-4 [&>li]:contents">
        {item.parts.map((part, index) => (
          <li key={index}>
            <span>
              {part.type === 'PromptField'
                ? resourcesText.promptField()
                : part.type === 'Field'
                ? schemaText.field()
                : part.type === 'ThisField'
                ? resourcesText.thisField()
                : resourcesText.urlPart()}
            </span>
            <Part
              part={[
                part,
                (part): void =>
                  handleChange(replaceItem(item.parts, index, part)),
              ]}
              table={item.table}
            />
            {isReadOnly ? (
              <span />
            ) : (
              <Button.Small
                variant={className.redButton}
                onClick={(): void =>
                  handleChange(removeItem(item.parts, index))
                }
              >
                {icons.trash}
              </Button.Small>
            )}
          </li>
        ))}
      </Ul>
      {!isReadOnly && (
        <div className="flex gap-2">
          <Button.Blue
            onClick={(): void =>
              handleChange([...item.parts, { type: 'UrlPart', value: '' }])
            }
          >
            {resourcesText.addUrlPart()}
          </Button.Blue>
          <Button.Blue
            onClick={(): void =>
              handleChange([...item.parts, { type: 'Field', field: [] }])
            }
          >
            {resourcesText.addField()}
          </Button.Blue>
          <Button.Blue
            onClick={(): void =>
              handleChange([
                ...item.parts,
                {
                  type: 'PromptField',
                  label: '',
                },
              ])
            }
          >
            {resourcesText.addPromptField()}
          </Button.Blue>
          <Button.Blue
            onClick={(): void =>
              handleChange([...item.parts, { type: 'ThisField' }])
            }
          >
            {resourcesText.addThisField()}
          </Button.Blue>
        </div>
      )}
    </>
  );
}

function Part({
  table,
  part: [part, setParameter],
}: {
  readonly table: SpecifyTable | undefined;
  readonly part: GetSet<WebLink['parts'][number]>;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const openIndex = React.useState<number | undefined>(undefined);
  return (
    <div>
      {part.type === 'UrlPart' ? (
        <Input.Text
          isReadOnly={isReadOnly}
          value={part.value}
          onValueChange={(value): void => setParameter({ ...part, value })}
        />
      ) : part.type === 'Field' ? (
        <ResourceMapping
          isRequired
          mapping={[
            part.field,
            (field = []): void => setParameter({ ...part, field }),
          ]}
          openIndex={openIndex}
          table={table!}
        />
      ) : part.type === 'ThisField' ? null : (
        <Input.Text
          isReadOnly={isReadOnly}
          value={part.label}
          onValueChange={(label): void => setParameter({ ...part, label })}
        />
      )}
    </div>
  );
}
