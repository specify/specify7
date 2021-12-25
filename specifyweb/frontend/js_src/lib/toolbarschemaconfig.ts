import type { UserTool } from './components/main';
import SchemaConfigWrapperView from './components/schemaconfigwrapper';
import commonText from './localization/common';

const userTool: UserTool = {
  task: 'schema-config',
  title: commonText('schemaConfig'),
  view: ({ onClose }) => new SchemaConfigWrapperView({ onClose }),
};

export default userTool;
