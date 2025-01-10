import React from 'react';

import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { schemaText } from '../../localization/schema';
import { f } from '../../utils/functools';
import type { GetSet, RR } from '../../utils/types';
import { localized } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input, Select } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { ReadOnlyContext } from '../Core/Contexts';
import type { SpecifyTable } from '../DataModel/specifyTable';
import {
  GenericFormatterPickList,
  ResourceMapping,
} from '../Formatters/Components';
import { fetchFormatters } from '../Formatters/formatters';
import type { WebLink } from './spec';

const labels: RR<WebLink['parts'][number]['type'], string> = {
  Field: schemaText.field(),
  ThisField: resourcesText.thisField(),
  UrlPart: resourcesText.urlPart(),
  FormattedResource: resourcesText.formattedResource(),
};

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
      <H3>{commonText.colonHeader({ header: resourcesText.definition() })}</H3>
      <Ul className="grid grid-cols-[auto_1fr_auto] gap-4 [&>li]:contents">
        {item.parts.map((part, index) => (
          <li key={index}>
            <Select
              placeholder={resourcesText.type()}
              value={part.type}
              onValueChange={(type): void =>
                handleChange(
                  replaceItem(
                    item.parts,
                    index,
                    type === 'Field'
                      ? {
                          type: 'Field',
                          field: [],
                        }
                      : type === 'ThisField'
                        ? {
                            type: 'ThisField',
                          }
                        : type === 'FormattedResource'
                          ? {
                              type: 'FormattedResource',
                              formatter: localized(''),
                            }
                          : {
                              type: 'UrlPart',
                              value: localized(''),
                            }
                  )
                )
              }
            >
              {Object.entries(labels).map(([type, label]) => (
                <option key={type} value={type}>
                  {label}
                </option>
              ))}
            </Select>
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
                variant={className.dangerButton}
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
          <Button.Info
            onClick={(): void =>
              handleChange([
                ...item.parts,
                { type: 'UrlPart', value: localized('') },
              ])
            }
          >
            {commonText.add()}
          </Button.Info>
        </div>
      )}
    </>
  );
}

const formattersPromise = f.store(async () =>
  fetchFormatters.then(({ formatters }) =>
    Object.fromEntries(
      formatters.map((formatter) => [formatter.name, formatter])
    )
  )
);

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
        table === undefined ? (
          resourcesText.selectTableFirst()
        ) : (
          <ResourceMapping
            mapping={[
              part.field,
              (field = []): void => setParameter({ ...part, field }),
            ]}
            openIndex={openIndex}
            table={table}
          />
        )
      ) : part.type === 'ThisField' ? null : part.type ===
        'FormattedResource' ? (
        table === undefined ? (
          resourcesText.selectTableFirst()
        ) : (
          <GenericFormatterPickList
            itemsPromise={formattersPromise()}
            table={table}
            value={part.formatter}
            onChange={(formatter): void => setParameter({ ...part, formatter })}
          />
        )
      ) : null}
    </div>
  );
}
