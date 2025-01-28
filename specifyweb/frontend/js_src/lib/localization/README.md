# Front-end Localization

## Adding new language

1. Open the
   [weblate language list webpage](https://hosted.weblate.org/languages/)
2. In the list of languages find the one you would like to add. I recommend
   picking a variant of the language that has the most translated strings to
   benefit from translation memory and community translations (i.e, pick
   `Spanish`, instead of `Spanish (Latin America)`).
3. After you decided on the language, click on it to open language details. On
   that webpage, click on the "Information" tab at the top. (for example, for
   spanish language, it's this webpage -
   https://hosted.weblate.org/languages/es/#information)
4. Look up the value for the "Language code" and write it down.
5. Open [`./utils/config.ts`](./utils/config.ts)
6. Find the `languageCodeMapper` variable
7. Add a new entry to the `languageCodeMapper` variable. The key is the language
   code. Pick the most appropriate from
   [this list](http://www.i18nguy.com/unicode/language-identifiers.html) (that
   is the Django supported language code list). The key you pick here will
   influence how the language is called in the UI, and which locale will be
   powering the internationalization (i.e, number formatting, relative dates,
   etc.).

   The value will be the weblate language code from step 4.

   For example, add an entry like this:

   ```
   'es-es': 'es',
   ```

   `'es-es'` is the _lowercase_ Django language code

   `'es'` is the Weblate language code

8. Open [`/specifyweb/settings/__init__.py`](/specifyweb/settings/__init__.py)
9. Add newly created language to `LANGUAGES` array.
10. Push the changes to `production` branch (weblate is setup to only look at
    that branch).
11. Weblate should do automatic translation for the language using Google
    Translate. If this did not happen automatically, you can trigger it
    manually:

    1. In
       [the list of language for the Specify 7 project](https://hosted.weblate.org/projects/specify-7/#languages),
       find the new language (it should be automatically added to the list once
       you push the changes). For example
       [Spanish](https://hosted.weblate.org/languages/es/specify-7/).
    2. For each component in the list, do the following:
       1. Open the component
       2. In the "Tools" menu, click on "Automatic translation"
       3. Use the following settings:
          - Automatic translation mode: "Add as Needing edit"
          - Search filter: "Unfinished strings"
          - Source of automated translation: "Machine translation"
          - Machine translation engines -> Chosen: "Google Translate"
          - Score threshold: I used 20 for this
       4. Click "Apply" and wait for it to finish

    Keep in mind that we are trying to stay under the free Google Translate API
    limit. To that end, don't do full automatic translation for more than 2
    languages per month.

    Weblate will also automatically translate any newly added string.

12. Weblate will commit the automated translation back to Specify 7 git
    repository within 3 hours as per our weblate configuration. After than, the
    language is available in the `edge` docker build (and any subsequent tagged
    release).

13. At this point, you should reach out to translators to go to Weblate, review
    the localization. Please send them
    [this Discourse guide](https://discourse.specifysoftware.org/t/get-started-with-specify-7-localization/956).

    When they review or edit a localization string, they should uncheck the
    "Needs editing" checkbox for a given string. This allows Weblate to keep
    track of what's left to translate/review.

14. Back in the [`./utils/config.ts`](./utils/config.ts) file, find
    `completeLanguages` array. This includes the list of languages that are
    considered production ready. If language is not in this list, user's will
    get a warning about translation being incomplete. Don't forget to update
    this list with the newly added key from `languageCodeMapper` once manual
    translation has been finished.

Note, this process can be simplified once
https://github.com/specify/specify7/issues/2604 is fixed.

For more technical details on our implementation, read the rest of this
document, as well as:

- README in the branch that stores weblate metadata:
  https://github.com/specify/specify7/tree/weblate-localization#readme
- The Weblate related portion of the test.yml file.
  [Link to that portion of code](https://github.com/specify/specify7/blob/8462d9bbe2bac448b2fcf56308d0298d4cc70604/.github/workflows/test.yml#L165-L210)
  (note, this is a permalink, thus the code in question may be updated, yet the
  link will still show older version)

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

- Don't use `'` in place of quotes because Weblate seems to get confused by
  them. Instead, use `"`. When `'` is part of a word, Weblate is ok.

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
