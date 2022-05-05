import React from 'react';
import { commonText } from '../../localization/common';
import { hasToolPermission } from '../../permissions';
import { getUserPref } from '../../preferencesutils';
import { schema } from '../../schema';
import { userInformation } from '../../userinfo';
import { icons } from '../icons';
import type { MenuItem } from '../main';
import { RecordSetsDialog } from '../recordsetsdialog';

export const menuItem: MenuItem = {
  task: 'recordsets',
  title: commonText('recordSets'),
  icon: icons.collection,
  isOverlay: true,
  enabled: () =>
    getUserPref('header', 'menu', 'showRecordSets') &&
    hasToolPermission('recordSets', 'read'),
  view: ({ onClose: handleClose }) => {
    const recordSets = new schema.models.RecordSet.LazyCollection({
      filters: {
        specifyuser: userInformation.id,
        type: 0,
        domainfilter: true,
        orderby: '-timestampcreated',
      },
    });
    return (
      <RecordSetsDialog
        recordSetsPromise={recordSets
          .fetch({ limit: 5000 })
          .then(({ models, _totalCount }) => ({
            recordSets: models,
            totalCount: _totalCount ?? models.length,
          }))}
        isReadOnly={false}
        onClose={handleClose}
      />
    );
  },
};
