# Instructions on localization

`locale` directory contains a subdirectory for each language in the format
`<language_code>/LC_MESSAGES/`. Inside `LC_MESSAGES`, there is a `django.po`
file that contains the `msgid` and `msgstr` for the strings used across the
back-end files.

According to the convention, `msgid` and `msgstr` have the same value for the
English language. All additional languages will use the same `msgid`, but change
`msgstr` to a needed value.

Back-end files can mark strings as translatable by enclosing the string within
the `_` function.

Example:

```python
from django.utils.translation import gettext as _

print(_("Some value to translate"))
```

After adding new translatable strings, run the following command from inside the
`specifyweb` directory to update the `.po` file for all locales:

```bash
../ve/bin/python ../manage.py makemessages -l en_US -l ru_RU -l ca --ignore js_src --ignore static
```

If you have multiple locales, specify the locale name of each. Example:
`-l en_US -l ru_RU -l ca`.

Later, in production, run the following command from inside the `specifyweb`
directory to compile the strings into an optimized `.mo` binary file:

```bash
../ve/bin/python ../manage.py compilemessages
```

[Here is the explanation](https://stackoverflow.com/a/56024182/8584605) for why
that has to be done from inside the `specifyweb` directory.

## Adding new languages

Add `(langauge_code, langauge_label)` tuple to the `LANGUAGES` array in
`./specifyweb/settings/__init__.py`. Then run the `makemessages` command
mentioned above, but add the `-l <locale_code>` argument to it. This would
create a directory for the new language with a `.po` file inside. Then, proceed
fill in the `msgstr` lines with the translated values.

NOTE: Keep in mind the difference between language codes and locale names.
[More info](https://docs.djangoproject.com/en/3.1/topics/i18n/#term-locale-name)

## Utilities

### Get text from a dictionary as array

1. Paste whole dictionary file content into an HTML <textbox>
2. Assign the `textbox` variable to the HTML Textbox element
3. Run this code in the DevTools console:

   ```js
   matches = Array.from(
     textarea.value.matchAll(
       /(?:msgid "([^"]+)"|msgid ""\n((?:.+\n)+)msgstr "")/g
     )
   ).map((match, index) => Array.from(match).slice(1).find(Boolean).trim());
   ```

## Additional resources

- [Comprehensive tutorial](https://lokalise.com/blog/advanced-django-internationalization/)
- [Official documentation](https://docs.djangoproject.com/en/3.2/topics/i18n/translation/#internationalization-in-python-code)
