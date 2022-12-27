# Router

React-Router is used for routing on the front-end.

An object is used to declare the routes. It is quite similar in schema to the
original React-Router configuration object, but has 2 additional fields.

See [./RouterUtils.tsx](./RouterUtils.tsx) for more details

## Routers

There are 3 instances of React-Router.

One is EntrypointRouter. It decides whether to display the Login page, the
Choose Collection page, the Password Change page or the Main page.

The other two routers are used only on the main page:

One router is responsible for displaying the content of the main page below the
header (or the 404 page).

Another is an OverlayRouter, which displays dialog windows that have their own
URL, but do not remove the content that is behind them (i.e, opening the
UserTools menu changes the URL, but does not unrender the view behind it)
