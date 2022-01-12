import type { MenuItem } from './components/main';
import commonText from './localization/common';
import RecordSetsDialog from './recordsetsdialog';
import schema from './schema';
import userInfo from './userinfo';

const menuItem: MenuItem = {
  task: 'recordsets',
  title: commonText('recordSets'),
  icon: '/static/img/record_sets.png',
  view({ onClose }) {
    const recordSets = new schema.models.RecordSet.LazyCollection({
      filters: {
        specifyuser: userInfo.id,
        type: 0,
        domainfilter: true,
        orderby: '-timestampcreated',
      },
    });
    return new RecordSetsDialog({
      recordSets: recordSets.fetch({ limit: 5000 }),
      readOnly: userInfo.isReadOnly,
      onClose,
    }).render();
  },
};

export default menuItem;
