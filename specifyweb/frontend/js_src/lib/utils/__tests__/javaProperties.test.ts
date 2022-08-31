import { theories } from '../../tests/utils';
import {
  getProperty,
  regexForJavaProperty,
  unescapeJavaProperty,
} from '../javaProperties';

theories(regexForJavaProperty, [
  { in: ['KEY_NAME.NAME'], out: /^KEY_NAME\.NAME(?:\s*[:=]|\s)\s*(.*)$/mu },
]);

theories(unescapeJavaProperty, [
  { in: [''], out: '' },
  { in: ['A"B'], out: 'A"B' },
]);

const resource = `
SymbiotaTask.SHOW_TASK_PREF.fish false
SymbiotaTask.BaseUrlPref=http\\://pinkava.asu.edu/symbiota/sandbox/webservices/dwc/dwcaingesthandler.php
recent_collection_id.abornstein.KU_Fish_Tissue : 4
attachment.path=
`;

theories(getProperty, [
  { in: [resource, 'SymbiotaTask.SHOW_TASK_PREF.fish'], out: 'false' },
  {
    in: [resource, 'SymbiotaTask.BaseUrlPref'],
    out: 'http\\://pinkava.asu.edu/symbiota/sandbox/webservices/dwc/dwcaingesthandler.php',
  },
  {
    in: [resource, 'recent_collection_id.abornstein.KU_Fish_Tissue'],
    out: '4',
  },
  { in: [resource, 'attachment.path'], out: '' },
  { in: [resource, 'unknown'], out: undefined },
]);
