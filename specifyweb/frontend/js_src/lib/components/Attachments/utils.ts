import { f } from '../../utils/functools';
import { filterArray } from '../../utils/types';
import { getModel, schema } from '../DataModel/schema';
import type { Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { hasTablePermission } from '../Permissions/helpers';

export const attachmentRelatedTables = f.store(() =>
  Object.keys(schema.models).filter((tableName) =>
    tableName.endsWith('Attachment')
  )
);

export const allTablesWithAttachments = f.store(() =>
  filterArray(
    attachmentRelatedTables().map((tableName) =>
      getModel(tableName.slice(0, -1 * 'Attachment'.length))
    )
  )
);
/** Exclude tables without read access*/
export const tablesWithAttachments = f.store(() =>
  allTablesWithAttachments().filter((model) =>
    hasTablePermission(model.name, 'read')
  )
);

/**
 * Gets the relationship to a Table's attachment table.
 * e.g., the collectionObjectAttachments relationship from CollectionObject to CollectionObjectAttachments
 * In most cases the relationship is called tableNameAttachments, although fetching the relationship
 * following that schema will not always be consitent as the following models relationship to their
 * attachment table is simply called `attachments`:
 * - DNASequence
 * - FieldNotebook
 * - FieldNotebookPage
 * - FieldNotebookPageSet
 */
export const getAttachmentRelationship = (
  table: SpecifyModel
): Relationship | undefined =>
  table.name === 'Attachment'
    ? undefined
    : table.relationships.find((relationship) => {
        const relatedModel = relationship.relatedModel.name;
        return (
          relatedModel !== 'Attachment' && relatedModel.endsWith('Attachment')
        );
      });
