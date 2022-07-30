import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { sortFunction } from '../helpers';
import { commonText } from '../localization/common';
import { wbText } from '../localization/workbench';
import { formatUrl } from '../querystring';
import { schema } from '../schema';
import { Button, Input, Label, Link, Ul } from './basic';
import { TableIcon } from './common';
import { Dialog } from './modaldialog';
import { useCachedState } from './statecache';

export function SchemaConfigTables(): JSX.Element {
  const { language = '' } = useParams();
  const navigate = useNavigate();

  const [showHiddenTables = false, setShowHiddenTables] = useCachedState(
    'schemaConfig',
    'showHiddenTables'
  );
  const sortedTables = React.useMemo(() => {
    const sortedTables = Object.values(schema.models).sort(
      sortFunction(({ name }) => name)
    );
    return showHiddenTables
      ? sortedTables
      : sortedTables.filter(({ isSystem }) => !isSystem);
  }, [showHiddenTables]);
  return (
    <Dialog
      buttons={
        <>
          <Link.Green
            download={`schema_localization_${language}.json`}
            href={formatUrl('/context/schema_localization.json', {
              lang: language,
            })}
          >
            {commonText('export')}
          </Link.Green>
          <span className="-ml-2 flex-1" />
          <Button.Gray onClick={(): void => navigate(-1)}>
            {commonText('back')}
          </Button.Gray>
        </>
      }
      header={commonText('tables')}
      onClose={(): void => navigate('/specify')}
    >
      <Ul className="flex-1 overflow-y-auto">
        {sortedTables.map((model) => (
          <li key={model.tableId}>
            <Link.Default
              href={`/specify/schema-config/${language}/${model.name}/`}
            >
              <TableIcon label={false} name={model.name} />
              {model.name}
            </Link.Default>
          </li>
        ))}
      </Ul>
      <Label.ForCheckbox>
        <Input.Checkbox
          checked={showHiddenTables}
          onValueChange={setShowHiddenTables}
        />
        {wbText('showAdvancedTables')}
      </Label.ForCheckbox>
    </Dialog>
  );
}
