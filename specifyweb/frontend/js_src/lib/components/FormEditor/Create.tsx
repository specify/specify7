import React from 'react';
import { useOutletContext } from 'react-router';
import { useNavigate } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { getUniqueName } from '../../utils/uniquifyName';
import { camelToHuman, group, split } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Form, Input, Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { Tables } from '../DataModel/types';
import type { ViewDefinition } from '../FormParse';
import { parseViewDefinition } from '../FormParse';
import { SpecifyForm } from '../Forms/SpecifyForm';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog } from '../Molecules/Dialog';
import { formatUrl, resolveRelative } from '../Router/queryString';
import type { FormEditorOutlet } from './index';
import type { ViewSets } from './spec';

export function CreateFormDefinition({
  table,
}: {
  readonly table: SpecifyTable;
}): JSX.Element {
  const [isCreating, handleCreating, handleNotCreating] = useBooleanState();
  const [views, setViews] = React.useState<Views | undefined>(undefined);
  const loading = React.useContext(LoadingContext);

  const [template, setTemplate] = React.useState<
    ViewDefinition | 'new' | undefined
  >(undefined);

  return (
    <>
      <div>
        <Button.Green
          onClick={(): void =>
            views === undefined
              ? loading(
                  fetchAllViews(table.name).then(setViews).then(handleCreating)
                )
              : handleCreating()
          }
        >
          {commonText.create()}
        </Button.Green>
      </div>
      {isCreating && typeof views === 'object' ? (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Blue onClick={(): void => setTemplate('new')}>
                {commonText.new()}
              </Button.Blue>
            </>
          }
          header={resourcesText.createNewForm()}
          onClose={handleNotCreating}
        >
          <div className="flex flex-col gap-8">
            <ListViews
              header={resourcesText.copyFromExistingForm()}
              table={table}
              views={views.database}
              onSelect={setTemplate}
            />
            <ListViews
              header={resourcesText.copyDefaultForm()}
              table={table}
              views={views.disk}
              onSelect={setTemplate}
            />
          </div>
        </Dialog>
      ) : undefined}
      {template !== undefined && (
        <ChooseName
          table={table}
          template={template}
          onClose={(): void => {
            setTemplate(undefined);
            handleNotCreating();
          }}
        />
      )}
    </>
  );
}

type PresentableViewDefinition = ViewDefinition & {
  readonly category: string;
  readonly editUrl: string | undefined;
};

type Views = {
  readonly database: RA<
    PresentableViewDefinition & { readonly collectionId: number }
  >;
  readonly disk: RA<PresentableViewDefinition>;
};

/**
 * Fetch all views for a given table accessible to current user in each collection
 * Note: this may result in duplicates
 */
export const fetchAllViews = async (
  tableName: keyof Tables,
  cache = false
): Promise<Views> =>
  Promise.all(
    userInformation.availableCollections.map(async ({ id }) =>
      ajax<RA<ViewDefinition>>(
        formatUrl('/context/views.json', {
          table: tableName,
          collectionid: id,
        }),
        {
          headers: {
            Accept: 'application/json',
          },
          cache: cache ? undefined : 'no-cache',
        }
      ).then(({ data }) => data.map((view) => ({ ...view, collectionId: id })))
    )
  ).then((data) => {
    const [disk, database] = split(
      data.flat(),
      (view) => view.viewsetFile === null
    );
    /*
     * Note, several requests may return the same view definition
     */
    return {
      // Deduplicate views from database
      database: Object.values(
        Object.fromEntries(
          database.map((view) => [`${view.viewsetId ?? ''}_${view.name}`, view])
        )
      ).map((view) => augmentDatabaseView(tableName, view)),
      // Deduplicate views from disk
      disk: Object.values(
        Object.fromEntries(
          disk.map((view) => [`${view.viewsetFile ?? ''}_${view.name}`, view])
        )
      ).map(augmentDiskView),
    };
  });

const augmentDatabaseView = (
  tableName: keyof Tables,
  view: ViewDefinition & { readonly collectionId: number }
): PresentableViewDefinition & { readonly collectionId: number } => ({
  ...view,
  category:
    (view.viewsetLevel === 'Collection'
      ? userInformation.availableCollections.find(
          ({ id }) => id === view.collectionId
        )?.collectionName
      : undefined) ?? camelToHuman(view.viewsetLevel),
  editUrl:
    view.viewsetId === null
      ? undefined
      : `/specify/resources/view-set/${view.viewsetId}/${tableName}/${view.name}/`,
});

const augmentDiskView = (view: ViewDefinition): PresentableViewDefinition => ({
  ...view,
  category:
    typeof view.viewsetFile === 'string'
      ? localizePath(view.viewsetFile)
      : camelToHuman(view.viewsetLevel),
  editUrl: undefined,
});

const localizePath = (path: string): string =>
  path.split('/').slice(0, -1).map(camelToHuman).join(' > ');

function ListViews({
  table,
  header,
  views,
  onSelect: handleSelect,
}: {
  readonly table: SpecifyTable;
  readonly header: LocalizedString;
  readonly views: Views['database'] | Views['disk'];
  readonly onSelect: (view: ViewDefinition) => void;
}): JSX.Element {
  const grouped = React.useMemo(
    () => group(views.map((view) => [view.category, view] as const)),
    [views]
  );
  const [preview, setPreview] = React.useState<ViewDefinition | undefined>(
    undefined
  );
  return (
    <div className="flex flex-col gap-4">
      <h3 className={className.headerPrimary}>{header}</h3>
      <div className="flex flex-col gap-2">
        {grouped.map(([category, views], index) => (
          <div className="flex flex-col gap-2" key={index}>
            <h4 className={className.headerGray}>{category}</h4>
            <Ul className="flex flex-col gap-2">
              {views.map((view, index) => (
                <li className="flex gap-2" key={index}>
                  <Button.LikeLink onClick={(): void => setPreview(view)}>
                    {view.name}
                  </Button.LikeLink>
                  {typeof view.editUrl === 'string' && (
                    <Link.Icon
                      className={className.dataEntryEdit}
                      href={view.editUrl}
                      icon="pencil"
                      title={commonText.edit()}
                    />
                  )}
                </li>
              ))}
            </Ul>
          </div>
        ))}
      </div>
      {typeof preview === 'object' && (
        <PreviewView
          table={table}
          view={preview}
          onClose={(): void => setPreview(undefined)}
          onSelect={(): void => handleSelect(preview)}
        />
      )}
    </div>
  );
}

export function PreviewView({
  table,
  view,
  onClose: handleClose,
  onSelect: handleSelect,
}: {
  readonly table: SpecifyTable;
  readonly view: ViewDefinition;
  readonly onClose: () => void;
  readonly onSelect: () => void;
}): JSX.Element {
  const resource = React.useMemo(() => new table.Resource(), [table]);
  const viewDefinition = React.useMemo(
    () => parseViewDefinition(view, 'form', 'edit', table),
    [view, table]
  );
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Button.Blue onClick={handleSelect}>
            {commonText.select()}
          </Button.Blue>
        </>
      }
      header={view.name}
      onClose={handleClose}
    >
      <SpecifyForm
        display="block"
        resource={resource}
        viewDefinition={viewDefinition}
      />
    </Dialog>
  );
}

function ChooseName({
  table,
  template,
  onClose: handleClose,
}: {
  readonly table: SpecifyTable;
  readonly template: ViewDefinition | 'new';
  readonly onClose: () => void;
}): JSX.Element {
  const id = useId('create-view')('');
  const {
    viewSets: [viewSets, setViewSets],
  } = useOutletContext<FormEditorOutlet>();

  const [name, setName] = React.useState(() =>
    getUniqueName(
      template === 'new' ? table.name : template.name,
      viewSets.views.map(({ name }) => name ?? ''),
      Number.POSITIVE_INFINITY,
      'name'
    )
  );

  const navigate = useNavigate();
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Submit.Blue>{commonText.create()}</Submit.Blue>
        </>
      }
      header={resourcesText.formDefinition()}
      onClose={handleClose}
    >
      <Form
        id={id}
        onSubmit={(): void => {
          setViewSets(handleSelect(name, template, viewSets), [name]);
          navigate(resolveRelative(`./${name}`));
        }}
      >
        <Label.Block>
          <Input.Text required value={name} onValueChange={setName} />
        </Label.Block>
      </Form>
    </Dialog>
  );
}

function handleSelect(
  name: string,
  template: ViewDefinition | 'new',
  viewSets: ViewSets
): ViewSets {
  /*
   * FIXME: consier how altview definitions should be handled
   * FIXME: generate formtable for tablesWithFormTable() if not already present
   * FIXME: generate iconview for all attachment tables
   * FIXME: make sure comments and unknowns are preserved
   */
  // FIXME: finish this
  console.log(view);
}
