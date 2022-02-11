import * as WbPlanViewHelper from '../wbplanviewhelper';
import { runTest } from './testmain';

export default function (): void {
  runTest(
    'WbPlanViewHelper.findArrayDivergencePoint',
    [
      [[['Accession', 'Accession Agents', '#1', 'Agent', 'First Name'], []], 0],
      [
        [['Accession', 'Accession Agents', '#1', 'Agent', 'First Name'], ['']],
        -1,
      ],
      [
        [
          ['Accession', 'Accession Agents', '#1', 'Agent', 'First Name'],
          ['Collection Object'],
        ],
        -1,
      ],
      [
        [
          ['Accession', 'Accession Agents', '#1', 'Agent', 'First Name'],
          ['Accession', 'Accession Agents'],
        ],
        2,
      ],
      [
        [
          ['Accession', 'Accession Agents', '#1', 'Agent', 'First Name'],
          ['Accession', 'Accession Agents', '#2'],
        ],
        -1,
      ],
    ],
    WbPlanViewHelper.findArrayDivergencePoint
  );
}
