/**
 * ResourceView loads a lot of dependencies. Can use LazyResourceView
 * to load it all asynchronously
 */
import { ReactLazy } from '../Router/ReactLazy';

export const LazyResourceView = ReactLazy(async () =>
  import('./ResourceView').then(({ ResourceView }) => ResourceView)
);
