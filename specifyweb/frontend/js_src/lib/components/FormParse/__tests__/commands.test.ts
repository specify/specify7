import { theories } from '../../../tests/utils';
import { parseUiCommand } from '../commands';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';

theories(parseUiCommand, [
  {
    in: [strictParseXml('<cell />')],
    out: {
      commandDefinition: {
        type: 'Unsupported',
        name: undefined,
      },
      label: undefined,
    },
  },
  {
    in: [strictParseXml('<cell name="test" label="test2" />')],
    out: {
      commandDefinition: {
        type: 'Unsupported',
        name: 'test',
      },
      label: 'test2',
    },
  },
  {
    in: [strictParseXml('<cell name="generateLabelBtn" />')],
    out: {
      commandDefinition: {
        type: 'GenerateLabel',
      },
      label: undefined,
    },
  },
  {
    in: [strictParseXml('<cell name="someName" label="ShowLoansBtn" />')],
    out: {
      commandDefinition: {
        type: 'ShowLoans',
      },
      label: 'ShowLoansBtn',
    },
  },
  {
    in: [strictParseXml('<cell name="ReturnLoan" label="generateLabelBtn" />')],
    out: {
      commandDefinition: {
        type: 'ReturnLoan',
      },
      label: 'generateLabelBtn',
    },
  },
]);
