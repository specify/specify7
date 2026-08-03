import { theories } from '../../../tests/utils';
import { downloadFile } from '../../Molecules/FilePicker';
import { downloadDataSet, getDelimitedFileName } from '../helpers';

jest.mock('../../Molecules/FilePicker', () => ({
  downloadFile: jest.fn().mockResolvedValue(undefined),
}));

afterEach(() => {
  jest.clearAllMocks();
});

// [WorkBench] Export column headings and rows as comma-separated values
test('exports headings and rows as CSV', async () => {
  await downloadDataSet(
    'Data Set',
    [
      ['100', 'First row'],
      ['200', ''],
    ],
    ['Catalog Number', 'Remarks'],
    ','
  );

  expect(downloadFile).toHaveBeenCalledWith(
    'Data Set.csv',
    'Catalog Number,Remarks\n100,First row\n200,\n'
  );
});

// [WorkBench] Use the selected delimiter when exporting a data set
test('exports rows using the selected delimiter', async () => {
  await downloadDataSet(
    'Data Set',
    [['100', 'First row']],
    ['Catalog Number', 'Remarks'],
    '\t' //delimeter is tab
  );

  expect(downloadFile).toHaveBeenCalledWith(
    'Data Set.tsv', // so the extension should be .tsv
    'Catalog Number\tRemarks\n100\tFirst row\n'
  );
});

theories(getDelimitedFileName, [
  {
    name: 'uses csv for comma delimiters',
    in: ['Data Set', ','],
    out: 'Data Set.csv',
  },
  {
    name: 'uses csv for semicolon delimiters',
    in: ['Data Set', ';'],
    out: 'Data Set.csv',
  },
  {
    name: 'uses tsv for tab delimiters',
    in: ['Data Set', '\t'],
    out: 'Data Set.tsv',
  },
  {
    name: 'uses psv for pipe delimiters',
    in: ['Data Set', '|'],
    out: 'Data Set.psv',
  },
  {
    name: 'uses txt for space delimiters',
    in: ['Data Set', ' '],
    out: 'Data Set.txt',
  },
  {
    name: 'replaces known delimited file extensions',
    in: ['Data.Set.TSV', ','],
    out: 'Data.Set.csv',
  },
  {
    name: 'preserves periods that are not known extensions',
    in: ['Dr. Smith Data Set', ','],
    out: 'Dr. Smith Data Set.csv',
  },
]);
