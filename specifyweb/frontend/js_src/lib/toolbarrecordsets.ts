import { icons } from './components/icons';
import type { MenuItem } from './components/main';
import createBackboneView from './components/reactbackboneextend';
import { RecordSetsDialog } from './components/recordsetsdialog';
import commonText from './localization/common';
import { schema } from './schema';
import { userInformation } from './userinfo';
import { hasToolPermission } from './permissions';

const RecordSetsView = createBackboneView(RecordSetsDialog);

const menuItem: MenuItem = {
  task: 'recordsets',
  title: commonText('recordSets'),
  icon: icons.collection,
  isOverlay: true,
  enabled: () => hasToolPermission('recordSets', 'read'),
  view({ onClose }) {
    const recordSets = new schema.models.RecordSet.LazyCollection({
      filters: {
        specifyuser: userInformation.id,
        type: 0,
        domainfilter: true,
        orderby: '-timestampcreated',
      },
    });
    return new RecordSetsView({
      recordSetsPromise: recordSets
        .fetch({ limit: 5000 })
        .then(({ models, _totalCount }) => ({
          recordSets: models,
          totalCount: _totalCount ?? models.length,
        })),
      isReadOnly: false,
      onClose,
    }).render();
  },
};

export default menuItem;
