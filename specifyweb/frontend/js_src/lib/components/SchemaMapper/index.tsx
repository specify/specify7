import React from 'react';

import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { Dialog } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';
import { MappingList } from './MappingList';
import type { MappingRecord } from './types';

export function SchemaMapperOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);

  // TODO: fetch schema mappings from API
  const coreMappings: ReadonlyArray<MappingRecord> = [];
  const extensionMappings: ReadonlyArray<MappingRecord> = [];

  return (
    <Dialog
      buttons={
        <Button.DialogClose>{commonText.close()}</Button.DialogClose>
      }
      header={headerText.schemaMapper()}
      icon={icons.documentSearch}
      onClose={handleClose}
    >
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="text-lg font-semibold">
            {headerText.coreMappings()}
          </h3>
          {coreMappings.length === 0 ? (
            <p className="text-gray-500">
              {headerText.noCoreMappings()}
            </p>
          ) : (
            <MappingList
              mappings={coreMappings}
              onClone={(_id) => {
                /* TODO: clone mapping */
              }}
              onEdit={(_id) => {
                /* TODO: open mapping editor */
              }}
            />
          )}
        </section>
        <section>
          <h3 className="text-lg font-semibold">
            {headerText.extensionMappings()}
          </h3>
          {extensionMappings.length === 0 ? (
            <p className="text-gray-500">
              {headerText.noExtensionMappings()}
            </p>
          ) : (
            <MappingList
              mappings={extensionMappings}
              onClone={(_id) => {
                /* TODO: clone mapping */
              }}
              onEdit={(_id) => {
                /* TODO: open mapping editor */
              }}
            />
          )}
        </section>
        <Button.Info
          onClick={() => {
            /* TODO: open new mapping dialog */
          }}
        >
          {headerText.newMapping()}
        </Button.Info>
      </div>
    </Dialog>
  );
}
