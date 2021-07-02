import { RA } from '../components/wbplanview';
import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./utils.tsx before editing this file

const formsText = createDictionary({
  // Attachments
  attachments: 'Attachments',
  attachmentServerUnavailable: 'Attachment server unavailable.',
  tables: 'Tables',
  openDataDialogTitle: 'Opening...',
  link: 'link',

  // BusinessRules
  valueMustBeUniqueToField: (fieldName: string) =>
    `Value must be unique to ${fieldName}`,
  valuesOfMustBeUniqueToField: (fieldName: string, values: RA<string>) =>
    `Values of ${
      values.length === 1
        ? values
        : `${values.slice(0, -1).join(', ')} and ${values.slice(-1)[0]}`
    }} must be unique to ${fieldName}}`,
  database: 'database',

  // CollectionReLoneToManyPlugin
  collectionObject: 'Collection Object',
  collection: 'Collection',
  collectionAccessDeniedDialogTitle: 'Access denied',
  collectionAccessDeniedDialogMessage: (collectionName: string)=>
    `You do not have access to the collection ${collectionName}
    through the currently logged in account.`,
  // "set" as in "Set Value"
  set: 'Set',

  // Data Model
  specifySchema: 'Specify Schema',

  // Data View
  emptyRecordSetMessage: (recordSetName: string)=>`
    <h2>The Record Set "${recordSetName}" contains no records.</h2>
    <p>You can <a class="recordset-delete">delete</a> the record set or
    <a class="recordset-add intercept-navigation">add</a> records to it.</p>
    <p>Be aware that another user maybe getting ready to add records,
    so only delete this record set if you are sure it is not to be used.</p>`,
  checkingIfResourceCanBeDeleted: 'Checking if resource can be deleted.',
  deleteBlockedDialogTitle: 'Delete Blocked',
  deleteBlockedDialogMessage: `
    The resource cannot be deleted because it is referenced through the
    following fields:`,
  newResourceTitle: (resourceName: string)=>`New ${resourceName}`,
});

export default formsText;
