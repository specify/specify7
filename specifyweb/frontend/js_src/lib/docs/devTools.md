# DevTools for development

## React DevTools

React DevTools Chrome and Firefox extension is an integral part of
troubleshooting or developing a React application. They allow to preview and
modify the state of any component.

## Development mode

When app is built in development, certain additional tools become available:

- `_schema` global object is created. It exposes the export from
  [`./schema`](../schema.ts) for easier debugging.
- `_permissions` global object is created. It contains user permissions from
  [`./permissions`](../permissions.ts) for easier debugging.
- `_csrf` global string is added, containing the CSRF authentication token,
  which is needed for many API calls. See [`../csrftoken.ts`](../csrftoken.ts)
- `_goTo` function is created. It allows to simulate a navigation by making
  router navigate to a given address.
- Error Dialogs can be dismissed when in Development.
- Autocomplete lists and CustomSelectElement lists do not close on outside
  click. This is to help with debugging them though browser's DevTools.
- UI localization languages that are not yet fully translated become available.
  This is controlled by [`../localization/utils.tsx](../localization/utils.tsx)
- Back-end permissions registry is checked to make sure front-end's list of
  permissions is kept in sync.
- Tailwind generates all possible class names, unlike in production, where it
  prunes unused class names.
