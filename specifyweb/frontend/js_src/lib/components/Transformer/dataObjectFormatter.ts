import { f } from '../../utils/functools';
import { schema } from '../DataModel/schema';
import { createSpec, pipe, xmlBuilder, xmlParser } from './index';
import { transformers } from './transformers';

const dataObjectFormatterSpec = f.store(() =>
  createSpec({
    name: pipe(
      transformers.xmlAttribute('name', true),
      transformers.default('')
    ),
    title: pipe(
      transformers.xmlAttribute('title', false),
      transformers.default('')
    ),
    tableName: pipe(
      transformers.xmlAttribute('class', true),
      transformers.default(schema.models.CollectionObject.longName),
      transformers.javaClassName
    ),
    isDefault: pipe(
      transformers.xmlAttribute('default', false),
      transformers.default('false'),
      transformers.toBoolean
    ),
    definition: transformers.xmlChild('switch'),
  })
);

export const dataObjectFormatterParser = f.store(() =>
  xmlParser(dataObjectFormatterSpec())
);
export const dataObjectFormatterBuilder = f.store(() =>
  xmlBuilder(dataObjectFormatterSpec())
);
