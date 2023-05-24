import { snapshot } from '../../../tests/reactUtils';
import { className } from '../className';
import { Link } from '../Link';
import { commonText } from '../../../localization/common';

snapshot(Link.Default, { href: '#', children: commonText.close() });
snapshot(Link.NewTab, { href: '#', children: commonText.close() });
describe('Link.Small', () => {
  snapshot(Link.Small, { href: '#' }, 'default variant');
  snapshot(
    Link.Small,
    {
      href: '#',
      variant: className.infoButton,
      className: 'a',
    },
    'custom variant'
  );
});
snapshot(Link.Fancy, { href: '#', children: commonText.close() });
snapshot(Link.Gray, { href: '#', children: commonText.close() });
snapshot(Link.BorderedGray, { href: '#', children: commonText.close() });
snapshot(Link.Red, { href: '#', children: commonText.close() });
snapshot(Link.Blue, { href: '#', children: commonText.close() });
snapshot(Link.Orange, { href: '#', children: commonText.close() });
snapshot(Link.Green, { href: '#', children: commonText.close() });
snapshot(Link.Icon, { href: '#', title: commonText.close(), icon: 'cog' });
