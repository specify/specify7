import type { ResourceView } from './ResourceView';
import { LazyAsync } from '../ReactLazy';

/**
 * ResourceView loads a lot of dependencies. Can use LazyResourceView
 * to load it all asynchronously
 */

export const LazyResourceView = LazyAsync<Parameters<typeof ResourceView>[0]>(
  () => import('./ResourceView').then(({ ResourceView }) => ResourceView)
);
