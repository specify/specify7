import { snapshot } from '../../../tests/reactUtils';
import { className } from '../className';
import { Link } from '../Link';

snapshot(Link.Default, { href: '#', children: 'Link' });
snapshot(Link.NewTab, { href: '#', children: 'Link' });
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
snapshot(Link.Fancy, { href: '#', children: 'Link' });
snapshot(Link.Secondary, { href: '#', children: 'Link' });
snapshot(Link.BorderedGray, { href: '#', children: 'Link' });
snapshot(Link.Danger, { href: '#', children: 'Link' });
snapshot(Link.Info, { href: '#', children: 'Link' });
snapshot(Link.Warning, { href: '#', children: 'Link' });
snapshot(Link.Success, { href: '#', children: 'Link' });
snapshot(Link.Icon, { href: '#', title: 'Link', icon: 'cog' });
