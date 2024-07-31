import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { headerText } from '../../localization/header';
import { resourcesText } from '../../localization/resources';
import { schemaText } from '../../localization/schema';
import { f } from '../../utils/functools';
import type { GetSet } from '../../utils/types';
import { localized } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { AppResourceContext } from '../AppResources/Editor';
import type { AppResources } from '../AppResources/hooks';
import { useAppResources } from '../AppResources/hooks';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { ReadOnlyContext } from '../Core/Contexts';
import { getField } from '../DataModel/helpers';
import {
  fetchResource,
  getResourceApiUrl,
  idFromUrl,
  resourceOn,
} from '../DataModel/resource';
import { getFieldBlockerKey, useSaveBlockers } from '../DataModel/saveBlockers';
import { tables } from '../DataModel/tables';
import { CollectionPicker } from '../Header/ChooseCollection';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { LoadingScreen } from '../Molecules/Dialog';
import { QueryComboBox } from '../QueryComboBox';
import type { TypeSearch } from '../QueryComboBox/spec';
import { dwcaAppResourceFilter, PickAppResource } from './Dwca';
import type { ExportFeedDefinition } from './spec';

export function ExportFeedEditor({
  definition: [definition, setDefinition],
}: {
  readonly definition: GetSet<ExportFeedDefinition>;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  return (
    <>
      <div className="flex flex-col gap-4">
        <Label.Block>
          {resourcesText.title()}
          <Input.Text
            isReadOnly={isReadOnly}
            placeholder="KUBI ichthyology RSS Feed"
            required
            value={definition.title ?? ''}
            onValueChange={(title): void =>
              setDefinition({ ...definition, title })
            }
          />
        </Label.Block>
        <Label.Block>
          {schemaText.description()}
          <AutoGrowTextArea
            isReadOnly={isReadOnly}
            placeholder="RSS feed for KUBI Ichthyology Voucher collections"
            required
            value={definition.description ?? ''}
            onValueChange={(description): void =>
              setDefinition({ ...definition, description })
            }
          />
        </Label.Block>
        <Label.Block>
          {commonText.language()}
          <Input.Text
            isReadOnly={isReadOnly}
            value={definition.language ?? ''}
            onValueChange={(language): void =>
              setDefinition({ ...definition, language })
            }
          />
        </Label.Block>
      </div>
      <FeedExportItems
        items={[
          definition.items,
          (items): void => setDefinition({ ...definition, items }),
        ]}
      />
    </>
  );
}

function FeedExportItems({
  items: [items, setItems],
}: {
  readonly items: GetSet<ExportFeedDefinition['items']>;
}): JSX.Element {
  return (
    <>
      <h4 className={`${className.headerGray} text-xl`}>
        {resourcesText.exports()}
      </h4>
      <Ul className="flex flex-col gap-8">
        {items.map((item, index) => (
          <FeedExportItem
            item={[
              item,
              (item): void => setItems(replaceItem(items, index, item)),
            ]}
            key={index}
            onRemove={(): void => setItems(removeItem(items, index))}
          />
        ))}
      </Ul>
      <Button.Success
        onClick={(): void =>
          setItems([
            ...items,
            {
              collectionId: undefined,
              userId: undefined,
              notifyUserId: undefined,
              definition: undefined,
              metadata: undefined,
              days: 7,
              fileName: undefined,
              publish: true,
              title: undefined,
              id: undefined,
              description: undefined,
              guid: undefined,
            },
          ])
        }
      >
        {commonText.add()}
      </Button.Success>
    </>
  );
}

function FeedExportItem({
  item: [item, setItem],
  onRemove: handleRemove,
}: {
  readonly item: GetSet<ExportFeedDefinition['items'][number]>;
  readonly onRemove: () => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const [resources] = useAppResources(false);
  return (
    <li className="flex flex-col flex-wrap gap-4 md:flex-row">
      <Button.Danger
        aria-label={commonText.remove()}
        disabled={isReadOnly}
        title={commonText.remove()}
        onClick={handleRemove}
      >
        {icons.trash}
      </Button.Danger>
      <div className="flex flex-1 flex-col gap-2 md:min-w-[theme(spacing.64)]">
        <Label.Block>
          {resourcesText.title()}
          <Input.Text
            isReadOnly={isReadOnly}
            placeholder="KU Fish"
            required
            value={item.title ?? ''}
            onValueChange={(title): void => setItem({ ...item, title })}
          />
        </Label.Block>
        <Label.Block>
          {schemaText.description()}
          <AutoGrowTextArea
            isReadOnly={isReadOnly}
            value={item.description ?? ''}
            onValueChange={(description): void =>
              setItem({ ...item, description })
            }
          />
        </Label.Block>
        <Label.Block>
          {resourcesText.fileName()}
          <AutoGrowTextArea
            isReadOnly={isReadOnly}
            placeholder="kui-dwca.zip"
            required
            value={item.fileName ?? ''}
            onValueChange={(fileName): void => setItem({ ...item, fileName })}
          />
        </Label.Block>
        <Label.Block>
          {commonText.id()}
          <Input.Text
            isReadOnly={isReadOnly}
            placeholder="8f79c802-a58c-447f-99aa-1d6a0790825a"
            value={item.id ?? ''}
            onValueChange={(id): void => setItem({ ...item, id })}
          />
        </Label.Block>
        <Label.Block>
          {getField(tables.CollectionObject, 'guid').label}
          <Input.Text
            isReadOnly={isReadOnly}
            value={item.guid ?? ''}
            onValueChange={(guid): void => setItem({ ...item, guid })}
          />
        </Label.Block>
      </div>
      <div className="flex flex-1 flex-col gap-2 md:min-w-[theme(spacing.80)]">
        <Label.Block>
          {headerText.dwcaResource()}
          <ResourcePicker
            resources={resources}
            type="definition"
            value={[
              item.definition ?? localized(''),
              (definition): void =>
                setItem({
                  ...item,
                  definition,
                }),
            ]}
          />
        </Label.Block>
        <Label.Block>
          {headerText.metadataResource()}
          <ResourcePicker
            resources={resources}
            type="metadata"
            value={[
              item.metadata ?? localized(''),
              (metadata): void =>
                setItem({
                  ...item,
                  metadata,
                }),
            ]}
          />
        </Label.Block>
        <Label.Block>
          {resourcesText.runAsUser()}
          <UserPicker
            type="userId"
            id={[
              item.userId,
              (userId): void =>
                setItem({
                  ...item,
                  userId,
                }),
            ]}
            isRequired
          />
        </Label.Block>
        <Label.Block>
          {resourcesText.notifyUser()}
          <UserPicker
            type="notifyUserId"
            id={[
              item.notifyUserId,
              (notifyUserId): void =>
                setItem({
                  ...item,
                  notifyUserId,
                }),
            ]}
            isRequired={false}
          />
        </Label.Block>
        <Label.Block>
          {resourcesText.runInCollection()}
          <CollectionPicker
            collectionId={[
              item.collectionId,
              (collectionId): void =>
                setItem({
                  ...item,
                  collectionId,
                }),
            ]}
            isReadOnly={isReadOnly}
          />
        </Label.Block>
        <Label.Inline>
          <Input.Checkbox
            checked={item.publish}
            isReadOnly={isReadOnly}
            onValueChange={(publish): void => setItem({ ...item, publish })}
          />
          {resourcesText.publish()}
        </Label.Inline>
        <Label.Block>
          {resourcesText.publishEveryDays()}
          <Input.Integer
            isReadOnly={isReadOnly}
            min={0}
            required
            value={item.days ?? 7}
            onValueChange={(days): void => setItem({ ...item, days })}
          />
        </Label.Block>
      </div>
    </li>
  );
}

function ResourcePicker({
  type,
  value: [value, setValue],
  resources,
}: {
  readonly type: 'definition' | 'metadata';
  readonly value: GetSet<LocalizedString>;
  readonly resources: AppResources | undefined;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const [isOpen, handleOpen, handleClose] = useBooleanState();

  const title =
    type === 'definition'
      ? headerText.chooseDwca()
      : headerText.chooseMetadataResource();
  return (
    <div className="flex gap-2">
      <Input.Text required value={value} />
      {!isReadOnly && (
        <Button.Info onClick={handleOpen}>{headerText.choose()}</Button.Info>
      )}
      {isOpen ? (
        resources === undefined ? (
          <LoadingScreen />
        ) : (
          <PickAppResource
            filters={dwcaAppResourceFilter}
            header={title}
            resources={resources}
            onClose={handleClose}
            onSelected={(definition): void => {
              setValue(localized(definition?.name ?? ''));
              handleClose();
            }}
          />
        )
      ) : undefined}
    </div>
  );
}

const specifyUserTypeSearch = f.store<TypeSearch>(() => ({
  displayFields: undefined,
  table: tables.SpecifyUser,
  searchFields: [[getField(tables.SpecifyUser, 'name')]],
  name: localized('SpecifyUserName'),
  title: getField(tables.SpecifyUser, 'name').label,
  formatter: undefined,
  format: undefined,
}));

function UserPicker({
  type,
  id: [id, setId],
  isRequired,
}: {
  readonly type: 'userId' | 'notifyUserId';
  readonly id: GetSet<number | undefined>;
  readonly isRequired: boolean;
}): JSX.Element {
  const resource = React.useMemo(() => new tables.Agent.Resource(), []);
  const field = getField(tables.Agent, 'specifyUser');

  const appResource = React.useContext(AppResourceContext);

  // Form field blocker
  const [_, setBlockers] = useSaveBlockers(resource, field);
  // Need to set a blocker on app resource to disable the save button
  const [__, setAppResourceBlocker] = useSaveBlockers(
    appResource,
    getField(tables.SpAppResource, 'specifyUser')
  );

  React.useEffect(() => {
    void resource.set(
      'specifyUser',
      id === undefined ? null : getResourceApiUrl('SpecifyUser', id)
    );
    if (id === undefined) return;
    // Fetch resource to check for invalid SpecifyUser id entered through XML editor
    fetchResource('SpecifyUser', id, false).then((res) => {
      if (destructorCalled) return;
      if (res?.id !== id)
        void resource.set(
          'specifyUser',
          res === undefined ? null : getResourceApiUrl('SpecifyUser', id)
        );
      if (res === undefined) {
        setBlockers(
          [formsText.invalidValue()],
          getFieldBlockerKey(field, `invalidSpecifyUser-${type}`)
        );
        setAppResourceBlocker(
          [formsText.invalidValue()],
          getFieldBlockerKey(field, `invalidSpecifyUser-${type}`)
        );
      } else {
        setBlockers(
          [],
          getFieldBlockerKey(field, `invalidSpecifyUser-${type}`)
        );
        setAppResourceBlocker(
          [],
          getFieldBlockerKey(field, `invalidSpecifyUser-${type}`)
        );
      }
    });
    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [id]);

  const setIdRef = React.useRef(setId);
  setIdRef.current = setId;
  React.useEffect(
    () =>
      resourceOn(
        resource,
        'change',
        () => setIdRef.current(idFromUrl(resource.get('specifyUser') ?? '')),
        false
      ),
    [resource]
  );

  return (
    <QueryComboBox
      field={field}
      forceCollection={undefined}
      formType="form"
      id={undefined}
      isRequired={isRequired}
      resource={resource}
      typeSearch={specifyUserTypeSearch()}
    />
  );
}
