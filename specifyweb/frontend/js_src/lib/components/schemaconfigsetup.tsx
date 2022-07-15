import React from 'react';

import { sortFunction } from '../helpers';
import { commonText } from '../localization/common';
import { wbText } from '../localization/workbench';
import { formatUrl, parseUrl } from '../querystring';
import { schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import { Button, Input, Label, Link, Ul } from './basic';
import { TableIcon } from './common';
import { Dialog } from './modaldialog';
import { SchemaConfigMain } from './schemaconfig';
import { ChooseSchemaLanguage } from './schemaconfiglanguages';
import type { SchemaData } from './schemaconfigsetuphooks';
import { useCachedState } from './statecache';

export function SchemaConfigLanguage({
  schemaData,
  onClose: handleClose,
}: {
  readonly schemaData: SchemaData;
  readonly onClose: () => void;
}): JSX.Element {
  const { language: defaultLanguage } = parseUrl();
  const [language, setLanguage] = React.useState<string | undefined>(
    defaultLanguage
  );
  return typeof language === 'string' ? (
    <SchemaConfigTables
      schemaData={schemaData}
      language={language}
      onBack={(): void => setLanguage(undefined)}
      onClose={handleClose}
    />
  ) : (
    <ChooseSchemaLanguage
      languages={schemaData.languages}
      onClose={handleClose}
      onSelected={setLanguage}
    />
  );
}

function SchemaConfigTables({
  schemaData,
  language,
  onBack: handleBack,
  onClose: handleClose,
}: {
  readonly schemaData: SchemaData;
  readonly language: string;
  readonly onClose: () => void;
  readonly onBack: () => void;
}): JSX.Element {
  const { table: defaultTable } = parseUrl();
  const [model, setModel] = React.useState<SpecifyModel | undefined>(
    Object.values(schema.models).find(({ name }) => name === defaultTable)
  );
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
  return typeof model === 'object' ? (
    <SchemaConfigMain
      schemaData={schemaData}
      language={language}
      model={model}
      onBack={(): void => setModel(undefined)}
    />
  ) : (
    <Dialog
      header={commonText('tables')}
      onClose={handleClose}
      buttons={
        <>
          <Link.Green
            href={formatUrl('/context/schema_localization.json', {
              lang: language,
            })}
            download={`schema_localization_${language}.json`}
          >
            {commonText('export')}
          </Link.Green>
          <span className="flex-1 -ml-2" />
          <Button.Gray onClick={handleBack}>{commonText('back')}</Button.Gray>
        </>
      }
    >
      <Ul className="flex-1 overflow-y-auto">
        {sortedTables.map((model) => (
          <li key={model.tableId}>
            <Button.LikeLink onClick={(): void => setModel(model)}>
              <TableIcon name={model.name} label={false} />
              {model.name}
            </Button.LikeLink>
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
