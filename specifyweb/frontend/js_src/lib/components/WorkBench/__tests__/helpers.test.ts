import { theories } from '../../../tests/utils';
import { getDelimitedFileName } from '../helpers';

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
