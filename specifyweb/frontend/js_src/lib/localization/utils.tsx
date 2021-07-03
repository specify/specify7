import type { RA, RR } from '../components/wbplanview';
import { camelToHuman } from '../wbplanviewhelper';

type Value = string | JSX.Element;
type Dictionary = RR<string, Value | ((...args: RA<never>) => Value)>;

function assertExhaustive(key: string): string | never {
  /*
   * If a .ts or .tsx file tries to access a non-existing key, a
   * build-time error would be thrown.
   * For .js and .jsx files, some errors may be shown in the editor depending on
   * the IDE. The rest would be thrown at runtime.
   * For templates (.html), no errors would be shown, and thus this exception
   * may be thrown at runtime.
   */
  const errorMessage = `
    Trying to access the value for a non-existent localization key "${key}"`;
  if (process.env.NODE_ENV === 'production') {
    console.error(errorMessage);
    // Convert a camel case key to a human readable form
    return camelToHuman(key);
  } else throw new Error(errorMessage);
}

export const createDictionary =
  <DICT extends Dictionary>(dictionary: DICT) =>
  <KEY extends string & keyof typeof dictionary>(
    key: KEY
  ): typeof dictionary[typeof key] =>
    key in dictionary
      ? dictionary[key]
      : (assertExhaustive(key) as typeof dictionary[typeof key]);

/*
 *
 * Guidelines for Programmers:
 *
 * - All keys must use strict camel case, unless absolutely necessary to do
 *   otherwise (e.x, in case of "S2N" or other proper nouns that contain
 *   numbers or capitalized letters)
 *
 * - Prefer full terms rather than acronyms or shortened variants.
 *   Some people may be unfamiliar with the acronyms used. Also, a single term
 *   may have multiple shortened variants, leading to inconsistencies and bugs.
 *   Notable exception is the "wb" (Workbench), as it is used extensively and
 *   does not have conflicting meanings. "ds" (Data Set) would not be a great
 *   choice as it is not used as widely, and can be confused for other terms
 *   (Disk Space, Demo Software, Describe Specify, Do Something, etc)
 *
 * - Similarly, try to be as consistent as possible in key naming.
 *   For example, in case of the dialog that appears when upload plan is not
 *   defined, use noUploadPlanDialogTitle, noUploadPlanDialogHeading,
 *   noUploadPlanDialogMessage for specifying the title, heading and the
 *   message of the dialog respectively.
 *
 * - Each dictionary must be named in camel case and end with "Text" for
 *   consistency and easy grepping
 *
 * - Do not use dynamic references, unless absolutely unavoidable.
 *   Incorrect example:
 *   wbText(hasError ?  'errorOccurred' : 'successMessage')
 *   Correct example:
 *   hasError ? wbText('errorOccurred') : wbText('successMessage')
 *   Similarly, don't construct key names dynamically.
 *   This is needed to simplify finding references of a particular value
 *   in the code. Also, it would allow to easily find unused values and remove
 *   them from the dictionary.
 *
 * - Each entry may be a string, a JSX Element, or a function that takes
 *   arbitrary arguments and returns a string or a JSX Element. It is important
 *   to not that in the case of functions, it must be pure (e.x produce the same
 *   output given the same output). It should also not relay on any external
 *   variables as those should be specified as an argument instead.
 *   Incorrect example:
 *   newDataSetName: ()=>`New Data Set ${new Date().toDateString()}`,
 *   Correct example:
 *   newDataSetName: (date: string)=>`New Data Set ${date}`,
 *
 * - When writing multi-line strings, keep in mind that some values are
 *   going to be used in whitespace sensitive contexts. Most common example
 *   is the "title" attribute of a button. Another example is the cell comment
 *   text in the Workbench. In such cases, use array join instead of the grave
 *   accent mark.
 *   Incorrect example:
 *   someWhitespaceSensitiveValue: `
 *     Lorem Ipsum is simply dummy text of the printing and typesetting
 *     industry. Lorem Ipsum has been the industry's standard dummy text
 *     ever since the 1500s
 *   `,
 *   Correct example:
 *   someWhitespaceSensitiveValue: [
 *     'Lorem Ipsum is simply dummy text of the printing and typesetting ',
 *     'industry. Lorem Ipsum has been the industry's standard dummy text ',
 *     'ever since the 1500s'
 *   ].join(''),
 *
 */
