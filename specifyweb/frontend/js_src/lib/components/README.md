# React Components

## Naming convention for files

`<name>` is the component name (e.x, `wbplanview`)

`components/` folder would contain these files:

 - `./<name>wrapper.tsx` - The entrypoint. Handles most of the side
   effects and external communication. Defines Backbone View which wraps
   the React component.
 - `./<name>.tsx` - The root component. Stores and mutates the state.
   If `./<name>wwrapper.tsx` is not defined, `./<name>.tsx` serves
   as the entrypoint.
 - `./<name>state.tsx` - State reducer (converts state object to JSX)
 - `./<name>components.tsx` - Common JSX components used in
   `./<name>state.tsx.

Additionally, parent folder (`lib`) includes:

 - `../<name>utils.ts` - High-level utility functions
 - `../<name>helper.ts` - Low-level utility functions
 - `../<name>reducer.ts` - State reducer (mutates the state) in
   response to user actions.

## State & Reducer

[typesafe-reducer](https://github.com/maxxxxxdlp/typesafe-reducer)
is used for state storage and state mutation (though a reducer).

Please read it's documentation to get acquainted with the
general principles.

Example usage is in `./wbplanviewstate.tsx` and
`../wbplanviewreducer.ts`.