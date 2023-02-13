import { requireContext } from '../../../tests/helpers';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import { parseUiCommand } from '../commands';
import { tables } from '../../DataModel/tables';

requireContext();

describe('parseUiCommand', () => {
  test('Simplest case', () => {
    jest.spyOn(console, 'error').mockImplementation();
    expect(
      parseUiCommand(strictParseXml('<cell />'), tables.CollectionObject)
    ).toEqual({
      commandDefinition: {
        type: 'Unsupported',
        name: undefined,
      },
      label: undefined,
    });
  });

  test('Unsupported command', () => {
    jest.spyOn(console, 'error').mockImplementation();
    expect(
      parseUiCommand(
        strictParseXml('<cell name="test" label="test2" />'),
        tables.CollectionObject
      )
    ).toEqual({
      commandDefinition: {
        type: 'Unsupported',
        name: 'test',
      },
      label: 'test2',
    });
  });

  test('Generate Label', () =>
    expect(
      parseUiCommand(
        strictParseXml('<cell name="generateLabelBtn" label="FINDNEXT" />'),
        tables.CollectionObject
      )
    ).toEqual({
      commandDefinition: {
        type: 'GenerateLabel',
      },
      label: 'Find Next',
    }));

  test('Show Loans Command', () =>
    expect(
      parseUiCommand(
        strictParseXml('<cell name="someName" label="ShowLoansBtn" />'),
        tables.Preparation
      )
    ).toEqual({
      commandDefinition: {
        type: 'ShowLoans',
      },
      label: 'ShowLoansBtn',
    }));

  test('Return Loan Command', () =>
    expect(
      parseUiCommand(
        strictParseXml('<cell name="ReturnLoan" label="generateLabelBtn" />'),
        tables.Loan
      )
    ).toEqual({
      commandDefinition: {
        type: 'ReturnLoan',
      },
      label: 'generateLabelBtn',
    }));
});
