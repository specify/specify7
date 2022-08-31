import { theories } from '../../tests/utils';
import {
  getProperty,
  regexForJavaProperty,
  unescapeJavaProperty,
} from '../javaProperties';

theories(regexForJavaProperty, [
  [['KEY_NAME.NAME'], /^KEY_NAME\.NAME(?:\s*[:=]|\s)\s*(.*)$/mu],
]);

theories(unescapeJavaProperty, [
  [[''], ''],
  [['A"B'], 'A"B'],
]);

const resource = `
SymbiotaTask.SHOW_TASK_PREF.fish false
SymbiotaTask.BaseUrlPref=http\\://pinkava.asu.edu/symbiota/sandbox/webservices/dwc/dwcaingesthandler.php
recent_collection_id.abornstein.KU_Fish_Tissue : 4
attachment.path=
`;

theories(getProperty, [
  [[resource, 'SymbiotaTask.SHOW_TASK_PREF.fish'], 'false'],
  [
    [resource, 'SymbiotaTask.BaseUrlPref'],
    'http\\://pinkava.asu.edu/symbiota/sandbox/webservices/dwc/dwcaingesthandler.php',
  ],
  [[resource, 'recent_collection_id.abornstein.KU_Fish_Tissue'], '4'],
  [[resource, 'attachment.path'], ''],
  [[resource, 'unknown'], undefined],
]);
