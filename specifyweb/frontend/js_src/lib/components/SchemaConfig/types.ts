import type { IR, RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import type {
  SpLocaleContainer,
  SpLocaleContainerItem,
} from '../DataModel/types';
import type { WithFetchedStrings } from '../Toolbar/SchemaConfig';
import type { NewSpLocaleItemString, SpLocaleItemString } from './index';
import type { SchemaData } from './schemaData';

export type SchemaConfigEditorState = {
  readonly container: SerializedResource<SpLocaleContainer>;
  readonly name: NewSpLocaleItemString | SpLocaleItemString;
  readonly desc: NewSpLocaleItemString | SpLocaleItemString;
  readonly items: RA<
    SerializedResource<SpLocaleContainerItem> & WithFetchedStrings
  >;
  readonly changedItems: RA<number>;
  readonly initialContainer: SerializedResource<SpLocaleContainer>;
  readonly initialName: NewSpLocaleItemString | SpLocaleItemString;
  readonly initialDesc: NewSpLocaleItemString | SpLocaleItemString;
};

export type SchemaConfigStore = {
  readonly schemaData: SchemaData;
  readonly isReadOnly: boolean;
  readonly modifiedTables: RA<string>;
  readonly anyModified: boolean;
  readonly saveAll: () => Promise<unknown>;
  readonly loadTable: (tableName: string) => Promise<void>;
  readonly editors: IR<SchemaConfigEditorState>;
  readonly setContainer: (
    tableName: string,
    container: SerializedResource<SpLocaleContainer>
  ) => void;
  readonly setName: (
    tableName: string,
    name: NewSpLocaleItemString | SpLocaleItemString
  ) => void;
  readonly setDesc: (
    tableName: string,
    desc: NewSpLocaleItemString | SpLocaleItemString
  ) => void;
  readonly setItem: (
    tableName: string,
    index: number,
    item: SerializedResource<SpLocaleContainerItem> & WithFetchedStrings
  ) => void;
};

export type SaveRequest = {
  readonly promise: Promise<unknown>;
  readonly itemIndex?: number;
  readonly reconcile: (
    editor: SchemaConfigEditorState,
    result: unknown
  ) => SchemaConfigEditorState;
};
