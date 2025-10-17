/*
 * See more about nominal types - https://zackoverflow.dev/writing/nominal-and-refinement-types-typescript
 * This Nomintal type is very simple (copied from https://www.npmjs.com/package/nominal-types)
 * But there is also this library that provides more features - https://www.npmjs.com/package/@coderspirit/nominal (TODO: explore it)
 */
const brand = Symbol('nominal');
export type Nominal<TYPE, NAME extends string> = TYPE & {
  readonly [brand]: readonly [NAME];
};
