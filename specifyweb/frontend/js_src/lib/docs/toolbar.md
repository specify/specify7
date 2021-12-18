# Toolbar

Menu items and user tools are defined in `./headerui.js`
(the `toolModules` array).

Each module exports an object like this:

```typescript
type HeaderItem = {
  // Unique task name
  readonly task: string;
  readonly title: string;
  readonly icon?: string;
  readonly disabled?: ()=>boolean;
  // Runs the task
  readonly execute: ()=>void;
};
```

If `icon` is missing, menu item is moved to the `User Tools` menu, instead
of the main menu bar.