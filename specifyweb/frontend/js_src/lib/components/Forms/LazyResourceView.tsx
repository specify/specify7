import { LazyAsync } from '../ReactLazy';
import type { ResourceView } from './ResourceView';

/**
 * ResourceView loads a lot of dependencies. Can use LazyResourceView
 * to load it all asynchronously
 */

export const LazyResourceView = LazyAsync<Parameters<typeof ResourceView>[0]>(
  async () => import('./ResourceView').then(({ ResourceView }) => ResourceView)
);
