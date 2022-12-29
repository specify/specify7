# Front-end Localization

## Syntax for string parameters and plurals:

[Official documentation](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/runtime#syntax)

Note, official documentation does not describe the usage with JSX. For that, a
<StringToJsx> component has been added.

Example usage:

For a string like:

```js
const commonText = {
  ...
  jsx: {
    'en-en': '<link>A</link> {parameter:string} <link>B</link> <br /> <button>B</button> _'
  },
  ...
};
```

Call it like this:

```js
<StringToJsx
  string={commonText.jsx({ parameter: 'a' })}
  components: {
    link: (label) => <span>{label}</span>,
    button: (label) => <p>{label}</p>,
    br: <br />,
  },
/>
```

The result is:

```jsx
<>
  <span>A</span> a <span>B</span> <br /> <p>B</p> _
</>
```

## About the solution

The localization solution was built on top of
[typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n/)

Prior to this, a homegrown tiny library was used, but with the need to integrate
with third party localization UIs, we have outgrown the homegrown solution.

Among many available libraries, typesafe-i18n was selected for the following
reasons:

- It is type safe. Much more so than any other library available when this
  migration was made.

  Type safety provides awesome side effects:

  - Developers get autocomplete in the IDE
  - Developers can go to definition of the string with just one click
  - Developers get inline errors if they forget to pass parameter or use
    incorrect type
  - Besides better DX, bugs are caught though static analysis.

  There is an optional
  [generator](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/generator#generator)
  package that provides even greater type safety, but it comes at a great
  inconvenience to developers of having to have a separate script running in the
  background at all times. Even if one developer has that configured and uses
  it, it's hard to make sure all developers have it configured (especially for
  external developers) and don't forget to use it.

  Fortunately, this optional type safety does not give much more benefit for our
  not too-complicated use case, and thus it was not used.

- It is simple, small and customizable enough to fit our needs. For example,
  many react localization libraries require use of React contexts/hooks. This
  does not work for us as many localization strings are outside React
  components.

## Guidelines for Programmers

Follow these rules to maintain consistency across localization files and reduce
cognitive overhead of working with localization files (thus killing bugs)

- All keys must use strict camel case, unless absolutely necessary to do
  otherwise (e.x, in case of `S2N` or other proper nouns that contain numbers or
  capitalized letters)

- Prefer full terms rather than acronyms or shortened variants. Some people may
  be unfamiliar with the acronyms used.

  Also, a single term may have multiple shortened variants, leading to
  inconsistencies and bugs. Notable exception is the `wb` (Workbench), as it is
  used extensively and does not have conflicting meanings. `ds` (Data Set) would
  not be a great choice as it is not used as widely, and can be confused for
  other terms (Disk Space, Demo Software, Describe Specify, Do Something, etc)

- Each dictionary must be named in camel case and end with "Text" for
  consistency and easy grepping

- Try to use consistent names for localization keys:

  ```yaml
  {
    ...
    pluginNotAvailable: {
      'en-us': 'Plugin Not Available',
      ...
    },
    pluginNotAvailableDescription: {
      'en-us': 'This plugin is currently unavailable for Specify 7',
      ...
    },
    pluginNotAvailableSecondDescription: {
      'en-us': `
        It was probably included on this form from Specify 6 and may be supported
        in the future.
      `,
      ...
    },
    ...
  }
  ```

- Do not use dynamic references.

  Incorrect example:

  ```javascript
  wbText[hasError ? 'errorOccurred' : 'successMessage']();
  ```

  Correct example:

  ```javascript
  hasError ? wbText.errorOccurred() : wbText.successMessage();
  ```

  Similarly, don't construct key names dynamically. This is needed to simplify
  finding references of a particular key in code. Also, it allows to easily find
  unused values and remove them from the dictionary.

- When writing multi-line strings, keep in mind that some values are going to be
  used in whitespace sensitive contexts. Most common example is the "title"
  attribute of a button. Another example is the cell comment text in the
  Workbench. In such cases, when using the string, wrap it in the
  whitespaceSensitive function. That function will trim all whitespace and join
  all lines into one. To explicitly specify a line break, leave a completely
  empty line.

  Example definition:

  ```javascript
  someWhitespaceSensitiveValue: `
    Lorem Ipsum is simply dummy text of the printing and typesetting
    industry.

    Lorem Ipsum has been the industry's standard dummy text
    ever since the 1500s
  `,
  ```

  Example call:

  ```javascript
  whitespaceSensitive(wbText.someWhitespaceSensitiveValue());
  ```

  Will result in:

  ```
  Lorem Ipsum is simply dummy text of the printing and typesetting industry.
  Lorem Ipsum has been the industry's standard dummy text ever since the 1500s
  ```
