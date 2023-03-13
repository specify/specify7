import { snapshot } from '../../../tests/reactUtils';
import { theories } from '../../../tests/utils';
import { f } from '../../../utils/functools';
import type { AnySchema } from '../../DataModel/helperTypes';
import type { SpecifyResource } from '../../DataModel/legacyTypes';
import type { SpecifyModel } from '../../DataModel/specifyModel';
import { columnDefinitionsToCss, DataEntry } from '../DataEntry';

theories(columnDefinitionsToCss, [
  { in: [[1, 2, 3], true], out: '1fr 2fr 3fr' },
  { in: [[1, 2, undefined, 3], false], out: '1px 2px auto 3px' },
]);

snapshot(DataEntry.Grid, {
  viewDefinition: {
    rows: [],
    columns: [1, 2, 3, undefined],
    formType: 'form',
    mode: 'edit',
    name: 'test',
    model: undefined as unknown as SpecifyModel,
  },
  flexibleColumnWidth: true,
  display: 'block',
  children: 'Test',
});

snapshot(DataEntry.Header, { children: 'Test' });
snapshot(DataEntry.Title, { children: 'Test' });

describe('DataEntry.Cell', () => {
  snapshot(
    DataEntry.Cell,
    {
      children: 'Test',
      colSpan: 1,
      align: 'right',
      visible: true,
    },
    'colspan 1, align right'
  );
  snapshot(
    DataEntry.Cell,
    {
      children: 'Test',
      colSpan: 3,
      align: 'left',
      visible: true,
    },
    'colspan 3, align left'
  );
  snapshot(
    DataEntry.Cell,
    {
      children: 'Test',
      colSpan: 1,
      align: 'left',
      visible: false,
    },
    'invisible'
  );
});

snapshot(DataEntry.Footer, { children: 'Test' });
snapshot(DataEntry.SubForm, { children: 'Test' });
snapshot(DataEntry.SubFormHeader, { children: 'Test' });
snapshot(DataEntry.SubFormTitle, { children: 'Test' });
snapshot(DataEntry.Add, { onClick: f.never });
snapshot(DataEntry.View, { onClick: f.never });
snapshot(DataEntry.Edit, { onClick: f.never });
snapshot(DataEntry.Clone, { onClick: f.never });
snapshot(DataEntry.Search, { onClick: f.never });
snapshot(DataEntry.Remove, { onClick: f.never });
describe('DataEntry.visit', () => {
  snapshot(DataEntry.Visit, { resource: undefined }, 'no resource');
  snapshot(
    DataEntry.Visit,
    {
      resource: {
        isNew: () => false,
        viewUrl: () => 'RESOURCE_VIEW_URL',
      } as unknown as SpecifyResource<AnySchema>,
    },
    'no resource'
  );
});
