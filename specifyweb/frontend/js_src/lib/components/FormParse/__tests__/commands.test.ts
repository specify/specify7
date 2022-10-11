import { theories } from '../../../tests/utils';
import { parseUiCommand } from '../commands';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import { requireContext } from '../../../tests/helpers';

requireContext();

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
    in: [strictParseXml('<cell name="generateLabelBtn" label="FINDNEXT" />')],
    out: {
      commandDefinition: {
        type: 'GenerateLabel',
      },
      label: 'Find Next',
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
