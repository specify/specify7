# Mock AJAX calls

Nearly all front-end HTTP requests go though the
[ajax function](../../utils/ajax/index.ts).

When in test mode, it intercepts all requests and serves static files from the
[`./static/`](./static) directory.
