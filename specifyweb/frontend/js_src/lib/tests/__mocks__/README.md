Most browser APIs are provided by the `jsdom` library when in test environment.

The APIs that are not provided by `jsdom` are mocked here.

[See more](https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom)

Note, these mocks only mock the basic functionality that is used by Specify 7 at
the moment. They may break if Specify 7 would start depending on things that are
not mocked.
