import SchemaConfigWrapperView from './components/schemaconfigwrapper';
import commonText from './localization/common';
import {setCurrentView} from './specifyapp';

export default {
  task: 'schema-config',
  title: commonText('schemaConfig'),
  execute() {
    setCurrentView(new SchemaConfigWrapperView());
  },
};
