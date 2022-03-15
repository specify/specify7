import React from 'react';

import { ajax, ping } from '../ajax';
import { fetchCollection } from '../collection';
import type { Collection, SpecifyUser } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import type { RA } from '../types';
import { UiPlugin } from '../uiplugin';
import { Button, Form, Input, Label, Submit } from './basic';
import { useId } from './hooks';
import { Dialog, LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';

function UserCollectionsUi({
  userId,
  selectedCollections,
  allCollections,
  onClose: handleClose,
}: {
  readonly userId: number;
  readonly selectedCollections: RA<number>;
  readonly allCollections: RA<SpecifyResource<Collection>>;
  readonly onClose: () => void;
}): JSX.Element {
  const [selected, setSelected] =
    React.useState<RA<number>>(selectedCollections);
  const [isLoading, setIsLoading] = React.useState(false);
  const id = useId('user-collection-ui');

  return isLoading ? (
    <LoadingScreen />
  ) : (
    <Dialog
      header={adminText('userCollectionsPluginDialogTitle')}
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText('close')}</Submit.Blue>
        </>
      }
    >
      <Form
        className="contents"
        id={id('form')}
        onSubmit={(event) => {
          event.preventDefault();
          setIsLoading(true);
          void ping(`/context/user_collection_access/${userId}/`, {
            method: 'PUT',
            body: selected,
          }).then(() => {
            setIsLoading(false);
            handleClose();
          });
        }}
      >
        {allCollections.map((collection) => (
          <Label.ForCheckbox key={collection.id}>
            <Input.Checkbox
              checked={selected.includes(collection.id)}
              onChange={(): void =>
                setSelected(
                  selected.includes(collection.id)
                    ? selected.filter((id) => id !== collection.id)
                    : [...selected, collection.id]
                )
              }
            />
            {collection.get('collectionName')}
          </Label.ForCheckbox>
        ))}
      </Form>
    </Dialog>
  );
}

const SetCollectionsView = createBackboneView(UserCollectionsUi);

export default UiPlugin.extend(
  {
    __name__: 'UserCollectionsPlugin',
    events: {
      click: 'click',
    },
    initialize(options: { readonly model: SpecifyResource<SpecifyUser> }) {
      this.user = options.model;
      this.allCollections = fetchCollection('Collection', { limit: 0 });
      this.selectedCollections = ajax<RA<number>>(
        `/context/user_collection_access/${this.user.id}/`,
        {
          headers: { Accept: 'application/json' },
        }
      ).then(({ data }) => data);
    },
    render() {
      this.el.value = adminText('collections');

      if (this.user.get('isadmin')) {
        this.el.disabled = true;
        this.el.setAttribute('title', adminText('notAvailableOnAdmins'));
        return this;
      }

      Promise.all([this.user.fetchPromise(), this.allCollections]).then(() => {
        this.el.textContent = adminText('collections');
        this.user.isNew() &&
          this.$el
            .attr('title', adminText('saveUserFirst'))
            .prop('disabled', true);
      });
      return this;
    },
    click() {
      Promise.all([this.selectedCollections, this.allCollections]).then(
        ([selectedCollections, allCollections]) => {
          const handleClose = (): void => void view.remove();
          const view = new SetCollectionsView({
            userId: this.user.id,
            selectedCollections,
            allCollections,
            onClose: handleClose,
          }).render();
        }
      );
    },
  },
  { pluginsProvided: ['UserCollectionsUI'] }
);
