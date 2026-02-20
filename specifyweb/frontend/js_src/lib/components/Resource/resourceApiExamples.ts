import type { Tables } from '../DataModel/types';
import type {
  NewResourceRef,
  ResourceRef,
  SavedResourceRef,
} from './resourceApi';

// Now, in the code can use these types as argument types in functions/components or in return types:

// Ref to new Accession resource
type A = NewResourceRef<'Accession'>;

// Ref to saved CollectionObject or Accession resource
type B = SavedResourceRef<'Accession' | 'CollectionObject'>;

// Ref to a saved or new resource, from any table whose name ends with Attachment
type C = ResourceRef<keyof Tables & `${string}Attachment`>;

// A ref to any resource from any table
type D = ResourceRef<keyof Tables>;
