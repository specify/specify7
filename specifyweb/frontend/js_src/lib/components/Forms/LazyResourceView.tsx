import React from 'react';

/**
 * ResourceView loads a lot of dependencies. Can use LazyResourceView
 * to load it all asynchronously
 */
export const LazyResourceView = React.lazy(async () =>
  import('./ResourceView').then(({ ResourceView }) => ({
    default: ResourceView,
  }))
);
