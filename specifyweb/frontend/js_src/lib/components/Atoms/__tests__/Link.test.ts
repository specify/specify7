import { commonText } from '../../../localization/common';
import { snapshot } from '../../../tests/reactUtils';
import { className } from '../className';
import { Link } from '../Link';

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
snapshot(Link.Secondary, { href: '#', children: commonText.close() });
snapshot(Link.BorderedGray, { href: '#', children: commonText.close() });
snapshot(Link.Danger, { href: '#', children: commonText.close() });
snapshot(Link.Info, { href: '#', children: commonText.close() });
snapshot(Link.Warning, { href: '#', children: commonText.close() });
snapshot(Link.Success, { href: '#', children: commonText.close() });
snapshot(Link.Icon, { href: '#', title: commonText.close(), icon: 'cog' });
