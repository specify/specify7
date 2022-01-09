import $ from 'jquery';
import React from 'react';

import ajax from '../ajax';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import schema from '../schema';
import type { RA } from '../types';
import UIPlugin from '../uiplugin';
import { BlueSubmit, Checkbox, LabelForCheckbox } from './basic';
import { useId } from './hooks';
import { LoadingScreen, Dialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';

function UserCollectionsUi({
  userId,
  selectedCollections,
  allCollections,
  onClose: handleClose,
}: {
  readonly userId: number;
  readonly selectedCollections: RA<number>;
  readonly allCollections: RA<SpecifyResource>;
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
      buttons={[
        'close',
        <BlueSubmit key="button" form={id('form')}>
          {commonText('close')}
        </BlueSubmit>,
      ]}
    >
      <form
        className="gap-y-2 flex flex-col"
        id={id('form')}
        onSubmit={(event) => {
          event.preventDefault();
          setIsLoading(true);
          void ajax(`/context/user_collection_access/${userId}/`, {
            method: 'PUT',
            body: selected,
          }).then(() => {
            setIsLoading(false);
            handleClose();
          });
        }}
      >
        {allCollections.map((collection) => (
          <LabelForCheckbox key={collection.id}>
            <Checkbox
              checked={selected.includes(collection.id)}
              onChange={(): void =>
                setSelected(
                  selected.includes(collection.id)
                    ? selected.filter((id) => id !== collection.id)
                    : [...selected, collection.id]
                )
              }
            />
            {collection.get<string>('collectionname')}
          </LabelForCheckbox>
        ))}
      </form>
    </Dialog>
  );
}

const SetCollectionsView = createBackboneView(UserCollectionsUi);

export default UIPlugin.extend(
  {
    __name__: 'UserCollectionsPlugin',
    events: {
      click: 'click',
    },
    initialize(options: { readonly model: SpecifyResource }) {
      this.user = options.model;
      this.allCollections = new schema.models.Collection.LazyCollection();
    },
    render() {
      this.el.value = adminText('collections');

      if (this.user.get('isadmin')) {
        this.el.disabled = true;
        this.el.setAttribute('title', adminText('notAvailableOnAdmins'));
        return this;
      }

      Promise.all([
        this.user.fetch(),
        this.allCollections.fetch({ limit: 0 }),
      ]).then(() => {
        this.el.textContent = adminText('collections');
        this.user.isNew() &&
          this.$el
            .attr('title', adminText('saveUserFirst'))
            .prop('disabled', true);
      });
      return this;
    },
    click() {
      $.get(`/context/user_collection_access/${this.user.id}/`).done(
        (permitted) => {
          const handleClose = (): void => void view.remove();
          const view = new SetCollectionsView({
            userId: this.user.id,
            selectedCollections: permitted,
            allCollections: this.allCollections.models,
            onClose: handleClose,
          }).render();
        }
      );
    },
  },
  { pluginsProvided: ['UserCollectionsUI'] }
);
