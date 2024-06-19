import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { fetchAllViews, filePathToHuman } from '../fetchAllViews';

requireContext();

test('fetchAllViews', async () =>
  expect(fetchAllViews('Accession')).resolves.toMatchSnapshot());

theories(filePathToHuman, [
  {
    in: ['common/common.views.xml'],
    out: 'Common',
  },
  {
    in: ['common/global.views.xml'],
    out: 'Common > Global',
  },
  {
    in: ['common/global/manager.views.xml'],
    out: 'Common > Global > Manager',
  },
  {
    in: ['manager.all.views.xml'],
    out: 'Manager',
  },
  {
    in: ['./common/manager.all.views.xml'],
    out: 'Common > Manager',
  },
  {
    in: ['/common/file/manager.all.views.xml'],
    out: 'Common > File > Manager',
  },
]);
