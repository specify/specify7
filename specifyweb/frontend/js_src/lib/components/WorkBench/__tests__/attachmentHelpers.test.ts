import { theories } from '../../../tests/utils';
import {
  attachmentsToCell,
  formatAttachmentsFromCell,
  getAttachmentsFromCell,
  usesAttachments,
} from '../attachmentHelpers';

theories(attachmentsToCell, [
  [[[], 'baseTable'], '{"attachments":[],"formatted":""}'],
]);

theories(getAttachmentsFromCell, [
  [[''], undefined],
  [['{"attachments":[],"formatted":""}'], undefined],
  [
    [
      '{"attachments":[{"id":1,"table":"baseTable"}, {"id": 2, "table":"baseTable"}],"formatted":"image1.jpg; image2.jpg"}',
    ],
    {
      attachments: [
        { id: 1, table: 'baseTable' },
        { id: 2, table: 'baseTable' },
      ],
      formatted: 'image1.jpg; image2.jpg',
    },
  ],
]);

theories(formatAttachmentsFromCell, [
  [[''], undefined],
  [['{"attachments":[],"formatted":""}'], ''],
  [
    [
      '{"attachments":[{"id":1,"table":"baseTable"}, {"id": 2, "table":"baseTable"}],"formatted":"image1.jpg; image2.jpg"}',
    ],
    'image1.jpg; image2.jpg',
  ],
]);

const datasetWithoutAttachments = { columns: [] };
const datasetWithAttachments = { columns: ['_UPLOADED_ATTACHMENTS'] };
theories(usesAttachments, [
  [[datasetWithoutAttachments as never], false],
  [[datasetWithAttachments as never], true],
]);
