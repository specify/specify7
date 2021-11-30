import SchemaConfigWrapperView from './components/schemaconfigwrapper';
import commonText from './localization/common';

export default {
  task: 'schema-config',
  title: commonText('schemaConfig'),
  execute() {
    new SchemaConfigWrapperView().render();
  },
};
