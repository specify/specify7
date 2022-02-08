import { icons } from './components/icons';
import type { MenuItem } from './components/main';
import commonText from './localization/common';
import RecordSetsDialog from './recordsetsdialog';
import { schema } from './schema';
import { userInformation } from './userinfo';

const menuItem: MenuItem = {
  task: 'recordsets',
  title: commonText('recordSets'),
  icon: icons.collection,
  view({ onClose }) {
    const recordSets = new schema.models.RecordSet.LazyCollection({
      filters: {
        specifyuser: userInformation.id,
        type: 0,
        domainfilter: true,
        orderby: '-timestampcreated',
      },
    });
    return new RecordSetsDialog({
      recordSets: recordSets.fetchPromise({ limit: 5000 }),
      readOnly: userInformation.isReadOnly,
      onClose,
    }).render();
  },
};

export default menuItem;
