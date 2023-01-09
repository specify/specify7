# Mock AJAX calls

Nearly all front-end HTTP requests go though the
[ajax function](../../utils/ajax/index.ts).

When in test mode, it intercepts all requests and serves static files from the
[`./static/`](./static) directory.

If you need to provide a query string, create a folder for the part of the URL
without the query string, and inside of it a file name for the query string
(without `?` as it is not supported in file names on Windows).

The URL matching algorithm tries to match with and without file extensions, thus
feel free to provide them even if not present in the original URL.

Example, for a URL like
`/context/app.resource?name=DefaultUserPreferences&quiet=`, create the following
folder structure:

```
context/
    app.resource/
        name=DefaultUserPreferences&quiet=.json
```
