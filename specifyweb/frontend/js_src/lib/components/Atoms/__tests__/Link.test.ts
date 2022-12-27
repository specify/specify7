import { className } from '../className';
import { Link } from '../Link';
import { snapshot } from '../../../tests/reactUtils';

snapshot(Link.Default, { href: '#', children: 'Link' });
snapshot(Link.NewTab, { href: '#', children: 'Link' });
describe('Link.Small', () => {
  snapshot(Link.Small, { href: '#' }, 'default variant');
  snapshot(
    Link.Small,
    {
      href: '#',
      variant: className.blueButton,
      className: 'a',
    },
    'custom variant'
  );
});
snapshot(Link.Fancy, { href: '#', children: 'Link' });
snapshot(Link.Gray, { href: '#', children: 'Link' });
snapshot(Link.BorderedGray, { href: '#', children: 'Link' });
snapshot(Link.Red, { href: '#', children: 'Link' });
snapshot(Link.Blue, { href: '#', children: 'Link' });
snapshot(Link.Orange, { href: '#', children: 'Link' });
snapshot(Link.Green, { href: '#', children: 'Link' });
snapshot(Link.Icon, { href: '#', title: 'Link', icon: 'cog' });
