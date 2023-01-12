import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { wbPlanText } from '../../localization/wbPlan';
import type { CacheDefinitions } from '../../utils/cache/definitions';
import { f } from '../../utils/functools';
import { sortFunction } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { schema } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { formatUrl } from '../Router/queryString';

export function SchemaConfigTables(): JSX.Element {
  const { language = '' } = useParams();
  const navigate = useNavigate();

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
            {commonText.export()}
          </Link.Green>
          <span className="-ml-2 flex-1" />
          <Button.Gray
            onClick={(): void => navigate('/specify/schema-config/')}
          >
            {commonText.back()}
          </Button.Gray>
        </>
      }
      header={schemaText.tables()}
      onClose={(): void => navigate('/specify')}
    >
      <TableList
        cacheKey="schemaConfig"
        getAction={(model): string =>
          `/specify/schema-config/${language}/${model.name}/`
        }
      />
    </Dialog>
  );
}

type CacheKey = {
  readonly [KEY in keyof CacheDefinitions]: CacheDefinitions[KEY] extends {
    readonly showHiddenTables: boolean;
  }
    ? KEY
    : never;
}[keyof CacheDefinitions];

export function TableList({
  cacheKey,
  getAction,
  filter,
  children,
}: {
  readonly cacheKey: CacheKey;
  readonly getAction: (model: SpecifyModel) => string | (() => void);
  readonly filter?: (showHiddenTables: boolean, model: SpecifyModel) => boolean;
  readonly children?: (model: SpecifyModel) => React.ReactNode;
}): JSX.Element {
  const [showHiddenTables = false, setShowHiddenTables] = useCachedState(
    cacheKey,
    'showHiddenTables'
  );

  const sortedTables = React.useMemo(
    () =>
      Object.values(schema.models)
        .filter(
          filter?.bind(undefined, showHiddenTables) ??
            (showHiddenTables ? f.true : ({ isSystem }): boolean => !isSystem)
        )
        .sort(sortFunction(({ name }) => name)),
    [filter, showHiddenTables]
  );

  return (
    <>
      <Ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {sortedTables.map((model) => {
          const action = getAction(model);
          const extraContent = children?.(model);
          const content = (
            <>
              <TableIcon label={false} name={model.name} />
              {model.name as LocalizedString}
              {typeof extraContent === 'object' && (
                <>
                  <span className="-ml-2 flex-1" />
                  {}
                </>
              )}
            </>
          );
          return (
            <li className="contents" key={model.tableId}>
              {typeof action === 'function' ? (
                <Button.LikeLink onClick={action}>{content}</Button.LikeLink>
              ) : (
                <Link.Default href={action}>{content}</Link.Default>
              )}
            </li>
          );
        })}
      </Ul>
      <Label.Inline>
        <Input.Checkbox
          checked={showHiddenTables}
          onValueChange={setShowHiddenTables}
        />
        {wbPlanText.showAdvancedTables()}
      </Label.Inline>
    </>
  );
}
