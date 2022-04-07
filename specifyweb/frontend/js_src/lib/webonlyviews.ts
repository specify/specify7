import { f } from './functools';
import { autoGenerateViewDefinition } from './generateformdefinitions';
import commonText from './localization/common';
import type { ParsedFormDefinition } from './parseform';
import { schema } from './schema';
import type { IR } from './types';
import { ensure } from './types';

export const webOnlyViews = f.store(() =>
  ensure<IR<ParsedFormDefinition>>()({
    ObjectAttachment: {
      columns: [undefined],
      rows: [
        [
          {
            id: undefined,
            type: 'Field',
            fieldName: undefined,
            fieldDefinition: {
              isReadOnly: false,
              type: 'Plugin',
              pluginDefinition: {
                type: 'AttachmentPlugin',
              },
            },
            isRequired: false,
            colSpan: 1,
            align: 'left',
            visible: true,
            ariaLabel: commonText('attachments'),
          },
        ],
      ],
    },
    SpecifyUser: autoGenerateViewDefinition(
      schema.models.SpecifyUser,
      'form',
      'edit',
      ['password', 'userType']
    ),
  } as const)
);
