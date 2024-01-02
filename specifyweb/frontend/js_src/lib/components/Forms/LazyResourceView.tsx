import { LazyAsync } from '../ReactLazy';

/**
 * ResourceView loads a lot of dependencies. Can use LazyResourceView
 * to load it all asynchronously
 */

export const LazyResourceView = LazyAsync(async () =>
  import('./ResourceView').then(({ ResourceView }) => ResourceView)
);
